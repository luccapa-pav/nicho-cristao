const FROM = "Luz Divina <noreply@luzdivina.app>";

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#FFFEF9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFEF9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:24px;border:1px solid #F5E6C8;padding:40px 32px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#D4A017,#B8860B);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <span style="color:#fff;font-size:24px;">✝</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#1E293B;">Luz Divina</h1>
        </td></tr>
        <tr><td>${body}</td></tr>
        <tr><td style="padding-top:32px;border-top:1px solid #F1F5F9;margin-top:32px;">
          <p style="color:#CBD5E1;font-size:11px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Luz Divina · Todos os direitos reservados
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada");
  const { Resend } = await import("resend");
  return new Resend(apiKey);
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const resend = await getResend();
  const url = `${process.env.NEXTAUTH_URL}/verificar-email/${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirme seu email — Luz Divina",
    html: emailShell(`
      <h2 style="font-size:18px;font-weight:600;color:#1E293B;margin:0 0 8px;">Bem-vindo, ${name}! 🙏</h2>
      <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Clique no botão abaixo para confirmar seu email e ativar sua conta. O link expira em <strong>24 horas</strong>.
      </p>
      <a href="${url}" style="display:block;text-align:center;background:linear-gradient(135deg,#D4A017,#B8860B);color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:16px;text-decoration:none;margin-bottom:20px;">
        Confirmar email
      </a>
      <p style="color:#94A3B8;font-size:12px;margin:0;">
        Se você não criou esta conta, ignore este email.
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resend = await getResend();
  const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha/${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Redefinição de senha — Luz Divina",
    html: emailShell(`
      <h2 style="font-size:18px;font-weight:600;color:#1E293B;margin:0 0 8px;">Olá, ${name} 🙏</h2>
      <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
      </p>
      <a href="${resetUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#D4A017,#B8860B);color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:16px;text-decoration:none;margin-bottom:20px;">
        Redefinir minha senha
      </a>
      <p style="color:#94A3B8;font-size:12px;line-height:1.6;margin:0 0 8px;">
        Se você não solicitou a redefinição de senha, ignore este email. Sua senha não será alterada.
      </p>
      <p style="color:#CBD5E1;font-size:11px;margin:0;">
        Ou copie e cole no navegador:<br/>
        <span style="color:#D4A017;word-break:break-all;">${resetUrl}</span>
      </p>
    `),
  });
}
