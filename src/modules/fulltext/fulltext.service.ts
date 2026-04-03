import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SubmitFulltextRequestDto } from './dto/submit-request.dto';

@Injectable()
export class FulltextService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * submitRequest creates a full-text access request for an approved document.
   *
   * Guests fill in their name, email, purpose, and department.
   * Admins will manually email the PDF once they fulfil the request.
   */
  async submitRequest(dto: SubmitFulltextRequestDto) {
    // Verify the document exists and is publicly approved
    const { data: document, error: docError } = await this.databaseService.client
      .from('documents')
      .select('id, title, status')
      .eq('id', dto.document_id)
      .eq('status', 'approved')
      .single();

    if (docError || !document) {
      throw new NotFoundException('Document not found or not publicly available.');
    }

    // Prevent duplicate pending requests from the same email for the same document
    const { data: existing } = await this.databaseService.client
      .from('fulltext_requests')
      .select('id')
      .eq('document_id', dto.document_id)
      .eq('requester_email', dto.requester_email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      throw new ConflictException(
        'You already have a pending full-text request for this document.',
      );
    }

    const { data: request, error } = await this.databaseService.client
      .from('fulltext_requests')
      .insert({
        document_id: dto.document_id,
        requester_name: dto.requester_name,
        requester_email: dto.requester_email,
        purpose: dto.purpose,
        department: dto.department,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Failed to submit full-text request.');
    }

    return {
      message:
        'Full-text request submitted successfully. You will be contacted via email once processed.',
      request,
    };
  }
}
