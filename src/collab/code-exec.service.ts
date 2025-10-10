import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CodeExecService {
  async executeCode(language: string, code: string): Promise<string> {
    // Using Judge0 public API for code execution
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      python: 'python3',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      go: 'go',
      ruby: 'ruby',
      typescript: 'typescript',
    };
    const lang = languageMap[language] || 'javascript';
    try {
      const res = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
        {
          source_code: code,
          language_id: this.getLanguageId(lang),
        },
        {
          headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || 'YOUR_RAPIDAPI_KEY',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
        },
      );
      return (
        res.data.stdout ||
        res.data.stderr ||
        res.data.compile_output ||
        'No output.'
      );
    } catch (err: any) {
      return err.message || 'Execution error.';
    }
  }

  // Map language name to Judge0 language_id
  getLanguageId(lang: string): number {
    const ids: Record<string, number> = {
      javascript: 63,
      python3: 71,
      java: 62,
      c: 50,
      cpp: 54,
      go: 60,
      ruby: 72,
      typescript: 74,
    };
    return ids[lang] || 63;
  }
}
