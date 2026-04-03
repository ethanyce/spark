import { Controller, Post, Body } from '@nestjs/common';
import { FulltextService } from './fulltext.service';
import { SubmitFulltextRequestDto } from './dto/submit-request.dto';

@Controller('fulltext-requests')
export class FulltextController {
  constructor(private readonly fulltextService: FulltextService) {}

  /**
   * POST /api/fulltext-requests
   * Public (Guest). Submit a request for full-text access to an approved document.
   * Admins will manually email the PDF to the requester.
   */
  @Post()
  submitRequest(@Body() dto: SubmitFulltextRequestDto) {
    return this.fulltextService.submitRequest(dto);
  }
}
