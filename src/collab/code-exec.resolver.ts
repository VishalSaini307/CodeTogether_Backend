import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { CodeExecService } from './code-exec.service';

@Resolver()
export class CodeExecResolver {
  constructor(private readonly codeExecService: CodeExecService) {}

  @Mutation(() => String)
  async runCode(
    @Args('language') language: string,
    @Args('code') code: string,
  ): Promise<string> {
    return await this.codeExecService.executeCode(language, code);
  }
}