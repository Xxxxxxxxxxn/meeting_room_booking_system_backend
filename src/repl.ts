import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

// 初始化数据。要么接口调用，要么使用repl。repl好麻烦，需要和命令结合使用
async function bootstrap() {
  const replServer = await repl(AppModule);
  replServer.setupHistory('.nestjs_repl_history', (err) => {
    if (err) {
      console.error(err);
    }
  });
}
bootstrap();
