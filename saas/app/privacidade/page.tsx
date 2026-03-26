import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — Vida com Jesus",
  description: "Saiba como o Vida com Jesus coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#FFFEF9] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-xl">✝</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-800">Política de Privacidade</h1>
          <p className="text-slate-400 text-sm mt-2">Última atualização: março de 2025</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-600">

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">1. Quem somos</h2>
            <p>
              O <strong>Vida com Jesus</strong> é um aplicativo cristão de crescimento espiritual. O responsável pelo tratamento dos seus dados pessoais é o operador do serviço Vida com Jesus, com sede no Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">2. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, endereço de email e senha (armazenada em hash seguro).</li>
              <li><strong>Dados de perfil:</strong> foto de perfil, bio, cidade, igreja e ministério — fornecidos voluntariamente por você.</li>
              <li><strong>Dados de uso:</strong> streaks diárias, devocionais concluídos, pedidos de oração, entradas do diário espiritual e versículos memorizados.</li>
              <li><strong>Dados de grupo:</strong> participação em fraternidades e interações no feed de gratidão.</li>
              <li><strong>Dados técnicos:</strong> tokens de dispositivo para notificações push (apenas com sua permissão explícita).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer e personalizar os recursos do aplicativo.</li>
              <li>Enviar notificações de lembrete de devocionais e streak (somente com sua permissão).</li>
              <li>Enviar emails transacionais como confirmação de cadastro e redefinição de senha.</li>
              <li>Melhorar o serviço com base em dados de uso agregados e anônimos.</li>
            </ul>
            <p className="mt-3">Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">4. Bases legais (LGPD)</h2>
            <p>Tratamos seus dados com fundamento nas seguintes bases previstas na Lei nº 13.709/2018 (LGPD):</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Execução de contrato</strong> — para prestar os serviços contratados.</li>
              <li><strong>Consentimento</strong> — para notificações push e comunicações opcionais.</li>
              <li><strong>Legítimo interesse</strong> — para melhoria do serviço e segurança da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">5. Retenção e exclusão</h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, todos os dados pessoais serão removidos em até 30 dias, exceto quando obrigação legal exigir retenção por período maior.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">6. Seus direitos</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Acessar, corrigir e portabilizar seus dados.</li>
              <li>Revogar consentimento a qualquer momento.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Obter informações sobre o compartilhamento dos seus dados.</li>
            </ul>
            <p className="mt-3">Para exercer seus direitos, entre em contato pelo email: <strong>privacidade@luzdivina.app</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">7. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo criptografia em trânsito (TLS), armazenamento seguro de senhas (bcrypt) e acesso restrito ao banco de dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">8. Cookies e tecnologias similares</h2>
            <p>
              Utilizamos cookies de sessão estritamente necessários para autenticação. Não utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">9. Alterações nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos alterações relevantes via email ou notificação no app. O uso continuado do serviço após as alterações implica aceitação da nova versão.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">10. Contato</h2>
            <p>
              Dúvidas? Fale conosco: <strong>privacidade@luzdivina.app</strong>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <Link href="/termos" className="hover:text-gold-dark transition-colors">Termos de Uso</Link>
          <Link href="/sign-in" className="hover:text-gold-dark transition-colors">← Voltar ao app</Link>
        </div>
      </div>
    </div>
  );
}
