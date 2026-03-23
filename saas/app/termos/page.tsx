import Link from "next/link";

export const metadata = {
  title: "Termos de Uso — Luz Divina",
  description: "Leia os Termos de Uso do aplicativo Luz Divina.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#FFFEF9] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-xl">✝</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-800">Termos de Uso</h1>
          <p className="text-slate-400 text-sm mt-2">Última atualização: março de 2025</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-600">

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta ou usar o <strong>Luz Divina</strong>, você concorda com estes Termos de Uso. Se não concordar com algum ponto, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">2. Descrição do serviço</h2>
            <p>
              O Luz Divina é um aplicativo de crescimento espiritual cristão que oferece devocionais diários, controle de streak de oração, diário espiritual, fraternidades virtuais, pedidos de oração e feed de gratidão. Parte dos recursos está disponível no plano gratuito; outros são exclusivos do plano Premium.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">3. Conta de usuário</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você é responsável por manter a confidencialidade da sua senha.</li>
              <li>Deve fornecer informações verdadeiras no cadastro.</li>
              <li>Cada pessoa pode ter apenas uma conta.</li>
              <li>Menores de 13 anos não devem criar contas sem supervisão dos responsáveis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">4. Conduta do usuário</h2>
            <p>Ao usar o Luz Divina, você se compromete a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Não publicar conteúdo ofensivo, discriminatório, falso ou que viole direitos de terceiros.</li>
              <li>Não utilizar o app para fins comerciais sem autorização.</li>
              <li>Não tentar acessar, modificar ou prejudicar sistemas do serviço.</li>
              <li>Respeitar outros membros das fraternidades e comunidades.</li>
            </ul>
            <p className="mt-3">Reservamo-nos o direito de suspender contas que violem estas regras.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">5. Planos e pagamentos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>O plano gratuito oferece acesso a recursos básicos sem cobrança.</li>
              <li>O plano Premium é cobrado mensalmente ou anualmente conforme o plano escolhido.</li>
              <li>Cancelamentos podem ser feitos a qualquer momento; o acesso Premium permanece até o fim do período pago.</li>
              <li>Não oferecemos reembolsos por períodos parcialmente utilizados, exceto quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">6. Propriedade intelectual</h2>
            <p>
              Todo o conteúdo do Luz Divina (textos, devocionais, design, código) é de propriedade do serviço ou licenciado por terceiros. Você não pode reproduzir, distribuir ou criar obras derivadas sem autorização expressa.
            </p>
            <p className="mt-2">
              Ao publicar conteúdo no app (gratidões, pedidos de oração), você nos concede uma licença não exclusiva para exibi-lo dentro da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">7. Disponibilidade do serviço</h2>
            <p>
              Nos esforçamos para manter o serviço disponível continuamente, mas não garantimos disponibilidade ininterrupta. Podemos realizar manutenções ou modificar recursos com ou sem aviso prévio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">8. Limitação de responsabilidade</h2>
            <p>
              O Luz Divina é fornecido "como está". Não nos responsabilizamos por danos indiretos, perda de dados ou interrupção do serviço. Nossa responsabilidade total está limitada ao valor pago pelo usuário nos últimos 3 meses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">9. Encerramento</h2>
            <p>
              Você pode encerrar sua conta a qualquer momento nas configurações do app. Podemos suspender ou encerrar contas que violem estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">10. Lei aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão resolvidas no foro da comarca competente no Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">11. Contato</h2>
            <p>
              Dúvidas sobre estes termos? Contate-nos em: <strong>suporte@luzdivina.app</strong>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <Link href="/privacidade" className="hover:text-gold-dark transition-colors">Política de Privacidade</Link>
          <Link href="/sign-in" className="hover:text-gold-dark transition-colors">← Voltar ao app</Link>
        </div>
      </div>
    </div>
  );
}
