import { createInoxAiSdk } from '../src/lib/ai-sdk/inoxAiSdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sua-anthropic-api-key';
const INOX_API_KEY = process.env.INOX_API_KEY || 'sua-inox-api-key';

async function main() {
  const sdk = createInoxAiSdk({
    apiKey: INOX_API_KEY,
    baseUrl: 'http://localhost:3000',
  });

  console.log('🧠 Claude AI Agent iniciado...\n');

  try {
    console.log('🎮 Criando jogo de plataforma 2D...\n');

    const project = await sdk.createProject({
      name: 'Claude Generated Platformer',
      description: 'Jogo de plataforma 2D gerado por Claude',
      platform: 'web',
      genre: 'platformer',
    });

    console.log('✅ Projeto criado:', project.name);

    const baseCode = await sdk.generateCode({
      projectId: project.projectId,
      prompt: 'Cria um jogo de plataforma 2D completo com:\n\n1. Personagem animado que pode mover e pular\n2. Plataformas em múltiplos níveis\n3. Sistema de física de gravidade\n4. Coleta de moedas\n5. Inimigos simples\n6. Sistema de pontuação\n7. Música e sons de fundo\n8. Animações suaves\n9. Responsivo para mobile',
      model: 'claude-3-sonnet-20240229',
    });

    console.log('✅ Código base gerado!');
    console.log('📝 Arquivos:', Object.keys(baseCode.code).join(', '));

    const modification1 = await sdk.chat({
      projectId: project.projectId,
      message: 'Como posso adicionar power-ups que dão pulo duplo temporário?',
    });

    console.log('\n💡 Dica 1:', modification1.response);

    const modified1 = await sdk.modifyCode({
      projectId: project.projectId,
      currentCode: baseCode.code,
      modificationRequest: 'Adiciona power-ups coloridos que dão pulo duplo por 5 segundos quando coletados',
    });

    console.log('✅ Modificação 1 aplicada: Power-ups adicionados');

    const modification2 = await sdk.chat({
      projectId: project.projectId,
      message: 'Como implemento inimigos com IA simples que patrulham as plataformas?',
    });

    console.log('\n💡 Dica 2:', modification2.response);

    const modified2 = await sdk.modifyCode({
      projectId: project.projectId,
      currentCode: modified1.modifiedCode,
      modificationRequest: 'Cria inimigos que se movem automaticamente entre plataformas e podem ser derrotados pulando em cima',
    });

    console.log('✅ Modificação 2 aplicada: Inimigos adicionados');

    const modification3 = await sdk.chat({
      projectId: project.projectId,
      message: 'Como criar múltiplos níveis com dificuldade progressiva?',
    });

    console.log('\n💡 Dica 3:', modification3.response);

    const modified3 = await sdk.modifyCode({
      projectId: project.projectId,
      currentCode: modified2.modifiedCode,
      modificationRequest: 'Cria 5 níveis completos com:\n- Nível 1: Tutorial, sem inimigos\n- Nível 2: 2 inimigos lentos\n- Nível 3: 3 inimigos, power-ups\n- Nível 4: 4 inimigos rápidos, menos plataformas\n- Nível 5: Boss final, todos os inimigos\n\nCada nível deve ter tema visual diferente e sistema de estrelas de 0-3',
    });

    console.log('✅ Modificação 3 aplicada: 5 níveis criados');

    const deploy = await sdk.deploy({
      projectId: project.projectId,
      platform: 'web',
      environment: 'production',
    });

    console.log('\n🚀 Iniciando deployment...');
    console.log('📦 Build ID:', deploy.buildId);

    const status = await sdk.waitForBuild(deploy.buildId);

    if (status.status === 'succeeded') {
      console.log('\n✨ Jogo completo publicado!');
      console.log('🔗 URL:', status.deployUrl);
      console.log('\n📊 Resumo:');
      console.log('   - Nome:', project.name);
      console.log('   - Plataforma:', 'web');
      console.log('   - Níveis: 5');
      console.log('   - Funcionalidades: Movimento, Pulo, Inimigos, Power-ups, Pontuação');
      console.log('   - Build ID:', deploy.buildId);
      console.log('   - URL:', status.deployUrl);
    } else {
      console.log('\n❌ Build falhou!');
      console.log('Logs:', status.logs);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as claudeAgentExample };
