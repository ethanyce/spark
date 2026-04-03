import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UploadDocumentDto } from '../student/dto/upload-material.dto';
import { ReviseDocumentDto } from './dto/revise-document.dto';
import { ListDocumentsDto } from './dto/list-documents.dto';

@Injectable()
export class DocumentsService {
  constructor(private databaseService: DatabaseService) {}

  // ─── POST /api/documents/upload ───────────────────────────────────────────

  /**
   * uploadDocument stores the PDF in Supabase Storage, then inserts
   * a record into the `documents` table with status='pending'.
   */
  async uploadDocument(userId: string, file: Express.Multer.File, dto: UploadDocumentDto) {
    const storagePath = `${userId}/${Date.now()}_${file.originalname}`;

    const { error: storageError } = await this.databaseService.client.storage
      .from('documents')
      .upload(storagePath, file.buffer, { contentType: file.mimetype });

    if (storageError) {
      throw new InternalServerErrorException(
        storageError.message || 'Failed to upload file to storage.',
      );
    }

    const { data: document, error: dbError } = await this.databaseService.client
      .from('documents')
      .insert({
        title: dto.title,
        authors: dto.authors,
        abstract: dto.abstract ?? null,
        year: dto.year ?? null,
        department: dto.department,
        type: dto.type,
        track_specialization: dto.track_specialization ?? null,
        adviser: dto.adviser ?? null,
        keywords: dto.keywords ?? null,
        pdf_file_path: storagePath,
        uploaded_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      await this.databaseService.client.storage.from('documents').remove([storagePath]);
      throw new InternalServerErrorException('Failed to save document record.');
    }

    return document;
  }

  // ─── PUT /api/documents/:id ───────────────────────────────────────────────

  /**
   * reviseDocument allows a student to re-upload a PDF and/or update metadata
   * when their document has status='revision'. Resets the status to 'pending'.
   */
  async reviseDocument(
    documentId: string,
    userId: string,
    file: Express.Multer.File | undefined,
    dto: ReviseDocumentDto,
  ) {
    // Only the owner may revise their document
    const { data: existing, error: fetchError } = await this.databaseService.client
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('uploaded_by', userId)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException('Document not found or access denied.');
    }

    if (existing.status !== 'revision') {
      throw new ForbiddenException(
        `Only documents with status 'revision' can be re-submitted. Current status: '${existing.status}'.`,
      );
    }

    let pdf_file_path = existing.pdf_file_path;

    if (file) {
      // Remove the old PDF and upload the new one
      await this.databaseService.client.storage
        .from('documents')
        .remove([existing.pdf_file_path]);

      const storagePath = `${userId}/${Date.now()}_${file.originalname}`;
      const { error: storageError } = await this.databaseService.client.storage
        .from('documents')
        .upload(storagePath, file.buffer, { contentType: file.mimetype });

      if (storageError) {
        throw new InternalServerErrorException('Failed to upload revised file.');
      }

      pdf_file_path = storagePath;
    }

    // Build the update payload — only include fields explicitly provided
    const updatePayload: Record<string, any> = {
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.authors !== undefined) updatePayload.authors = dto.authors;
    if (dto.abstract !== undefined) updatePayload.abstract = dto.abstract;
    if (dto.year !== undefined) updatePayload.year = dto.year;
    if (dto.track_specialization !== undefined)
      updatePayload.track_specialization = dto.track_specialization;
    if (dto.adviser !== undefined) updatePayload.adviser = dto.adviser;
    if (dto.keywords !== undefined) updatePayload.keywords = dto.keywords;
    if (pdf_file_path !== existing.pdf_file_path) updatePayload.pdf_file_path = pdf_file_path;

    const { data: updated, error: updateError } = await this.databaseService.client
      .from('documents')
      .update(updatePayload)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new InternalServerErrorException('Failed to update document record.');
    }

    return updated;
  }

  // ─── GET /api/documents ───────────────────────────────────────────────────

  /**
   * listDocuments returns paginated approved documents with optional filters.
   */
  async listDocuments(dto: ListDocumentsDto) {
    let query = this.databaseService.client
      .from('documents')
      .select(
        'id, title, authors, abstract, year, department, type, track_specialization, adviser, keywords, uploaded_by, created_at',
        { count: 'exact' },
      )
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (dto.department) query = query.eq('department', dto.department);
    if (dto.type) query = query.eq('type', dto.type);
    if (dto.year) query = query.eq('year', dto.year);
    if (dto.track) query = query.ilike('track_specialization', `%${dto.track}%`);
    if (dto.keyword) query = query.contains('keywords', JSON.stringify([dto.keyword]));

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) throw new BadRequestException(error.message);

    return { data, page, limit, total: count ?? 0 };
  }

  // ─── GET /api/documents/search ────────────────────────────────────────────

  /**
   * searchDocuments performs a full-text search across title, abstract,
   * authors (cast to text), and keywords (cast to text) for approved documents.
   */
  async searchDocuments(q: string) {
    if (!q?.trim()) {
      throw new BadRequestException('Search query (q) cannot be empty.');
    }

    const term = q.trim();

    const { data, error } = await this.databaseService.client
      .from('documents')
      .select(
        'id, title, authors, abstract, year, department, type, track_specialization, adviser, keywords, uploaded_by, created_at',
      )
      .eq('status', 'approved')
      .or(
        `title.ilike.%${term}%,abstract.ilike.%${term}%`,
      );

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  // ─── GET /api/documents/check-duplicate ───────────────────────────────────

  /**
   * checkDuplicate compares the provided title against all existing non-rejected
   * document titles using the Dice coefficient. Returns matches with similarity
   * ≥ 0.80.
   */
  async checkDuplicate(title: string) {
    if (!title?.trim()) {
      throw new BadRequestException('Title cannot be empty.');
    }

    const { data, error } = await this.databaseService.client
      .from('documents')
      .select('id, title')
      .neq('status', 'rejected');

    if (error) throw new BadRequestException(error.message);

    const normalizedInput = title.trim().toLowerCase();
    const matches = (data ?? [])
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        similarity: this.diceCoefficient(normalizedInput, doc.title.toLowerCase()),
      }))
      .filter((r) => r.similarity >= 0.8)
      .sort((a, b) => b.similarity - a.similarity);

    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  // ─── GET /api/documents/:id/download-abstract ─────────────────────────────

  /**
   * getAbstractContent returns the title and abstract for a public download.
   * Callers (controller) are responsible for formatting and setting headers.
   */
  async getAbstractContent(documentId: string) {
    const { data: document, error } = await this.databaseService.client
      .from('documents')
      .select('id, title, authors, abstract, year, department, type, adviser')
      .eq('id', documentId)
      .eq('status', 'approved')
      .single();

    if (error || !document) {
      throw new NotFoundException('Document not found or not publicly available.');
    }

    return document;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Dice coefficient — measures bigram overlap between two strings.
   * Returns a value between 0 (no overlap) and 1 (identical).
   */
  private diceCoefficient(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const getBigrams = (str: string): Set<string> => {
      const bigrams = new Set<string>();
      for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str[i] + str[i + 1]);
      }
      return bigrams;
    };

    const aBigrams = getBigrams(a);
    const bBigrams = getBigrams(b);

    let intersection = 0;
    for (const bigram of aBigrams) {
      if (bBigrams.has(bigram)) intersection++;
    }

    return (2 * intersection) / (aBigrams.size + bBigrams.size);
  }
}
