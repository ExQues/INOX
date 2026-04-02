import { createInoxAiSdk } from '../src/lib/ai-sdk/inoxAiSdk';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sua-openai-api-key';
const INOX_API_KEY = process.env.INOX_API_KEY || 'sua-inox-api-key';

async function main() {
  const sdk = createInoxAiSdk({
    apiKey: INOX_API_KEY,
    baseUrl: 'http://localhost:3000',
  });

  console.log('🤖 OpenAI Agent iniciado...\n');

  try {
    const game = await sdk.createGameFromDescription(
      `Quero um jogo de sobrevivência 3D em uma ilha tropical onde um jogador está em uma escola quando um meteoro atinge o centro da ilha.

      O jogo deve incluir:
      - Mapa de 2km² com biomas variados (floresta densa, praia, montanha, cavernas)
      - Sistema de sobrevivência (fome, sede, energia, temperatura)
      - Ciclo de dia/noite de 24 minutos (1 minuto = 1 hora)
      - Clima dinâmico (sol, nublado, chuva, tempestade)
      - Sistema de crafting básico (faca, machado, fogueira, tenda)
      - Inventário de 32 slots
      - Vegetação densa de palmeiras
      - Rio principal com 2 cachoeiras
      - Escola abandonada no oeste como ponto inicial
      - Sistema de save/load
      
      O jogo deve ser responsivo e funcionar em navegadores modernos.`,
      {
        platform: 'web',
        genre: 'survival',
        name: 'Survival Island - OpenAI Agent',
        model: 'gpt-4',
      }
    );

    console.log('✅ Projeto criado:', game.project.name);
    console.log('📄 Project ID:', game.project.projectId);
    console.log('💻 Código gerado com sucesso!');
    console.log('📝 Arquivos gerados:', Object.keys(game.code.code).length);
    console.log('🎨 Assets sugeridos:', game.code.assets.length);
    console.log('📖 Explicação:', game.code.explanation.substring(0, 200) + '...');

    const deploy = await sdk.deploy({
      projectId: game.project.projectId,
      platform: 'web',
      environment: 'production',
    });

    console.log('\n🚀 Iniciando deployment...');
    console.log('📦 Build ID:', deploy.buildId);
    console.log('⏱️  Tempo estimado:', deploy.estimatedTime, 'segundos');

    console.log('\n⏳ Aguardando build completar...');
    const status = await sdk.waitForBuild(deploy.buildId);

    if (status.status === 'succeeded') {
      console.log('\n✨ Jogo publicado com sucesso!');
      console.log('🔗 URL:', status.deployUrl);
      console.log('📊 Progresso:', status.progress, '%');
      console.log('📝 Logs:', status.logs.length, 'entradas');
    } else {
      console.log('\n❌ Build falhou!');
      console.log('Status:', status.status);
      console.log('Logs:', status.logs);
    }

  } catch (error) {
    console.error('❌ Erro ao criar jogo:', error.message);
    if (error.message.includes('API key')) {
      console.error('\n⚠️  Verifique suas chaves de API!');
      console.error('   - OPENAI_API_KEY:', OPENAI_API_KEY ? 'Configurada ✓' : 'Não configurada ✗');
      console.error('   - INOX_API_KEY:', INOX_API_KEY ? 'Configurada ✓' : 'Não configurada ✗');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as openaiAgentExample };
