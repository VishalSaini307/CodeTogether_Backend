import { Controller, Post, Body } from '@nestjs/common';
import { CodeExecService } from './code-exec.service';

@Controller('code-exec')
export class CodeExecController {
  constructor(private readonly codeExecService: CodeExecService) {}

  @Post('run')
  async runCode(@Body() body: { language: string; code: string }) {
    const output = await this.codeExecService.executeCode(body.language, body.code);
    return { output };
  }
}
