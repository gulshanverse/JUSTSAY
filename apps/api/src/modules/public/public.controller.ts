import { UsersController } from '../users/users.controller';
import { MessagesController } from '../messages/messages.controller';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJs(str: string): string {
  if (!str) return '';
  return JSON.stringify(str).slice(1, -1);
}

export class PublicWebController {
  private usersController: UsersController;
  private messagesController: MessagesController;

  constructor(usersController: UsersController, messagesController: MessagesController) {
    this.usersController = usersController;
    this.messagesController = messagesController;
  }

  public async renderPublicPage(rawHandle: string): Promise<string> {
    const handle = rawHandle.toLowerCase().trim();
    const safeHandle = escapeHtml(handle);

    const profile = await this.usersController.getPublicProfile(handle);
    if (!profile) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>User Not Found - JUSTSAY</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
            .card { background: #1E293B; border: 1px solid #334155; padding: 2rem; border-radius: 1rem; max-width: 400px; width: 90%; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #EF4444; }
            p { color: #94A3B8; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>User Not Found</h1>
            <p>The profile <strong>@${safeHandle}</strong> does not exist or has set their profile to private.</p>
          </div>
        </body>
        </html>
      `;
    }

    const safeDisplayName = escapeHtml(profile.displayName);
    const safePromptQuestion = escapeHtml(profile.promptQuestion);
    const jsSafeHandle = escapeJs(profile.handle);
    const jsSafePromptQuestion = escapeJs(profile.promptQuestion);
    const avatarInitial = escapeHtml(profile.displayName.substring(0, 1).toUpperCase());

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Send @${safeHandle} an Anonymous Message | JUSTSAY</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0B0F17; color: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
          .container { max-width: 440px; width: 100%; background: #161E2E; border: 1px solid #2A364F; border-radius: 20px; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 1.5rem; }
          .avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #EC4899); display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: bold; color: white; margin: 0 auto 0.75rem; border: 3px solid #1E293B; }
          .display-name { font-size: 1.25rem; font-weight: 700; color: #F8FAFC; }
          .handle { font-size: 0.875rem; color: #94A3B8; margin-top: 2px; }
          .prompt-box { background: #1E293B; border-left: 4px solid #6366F1; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; }
          .prompt-title { font-size: 0.75rem; text-transform: uppercase; tracking: 0.05em; color: #818CF8; font-weight: 700; margin-bottom: 4px; }
          .prompt-text { font-size: 1rem; font-weight: 600; color: #F1F5F9; }
          textarea { width: 100%; min-height: 120px; background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 0.875rem; color: #F8FAFC; font-size: 1rem; resize: vertical; outline: none; margin-bottom: 1rem; font-family: inherit; }
          textarea:focus { border-color: #6366F1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
          .send-btn { width: 100%; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; border: none; padding: 0.875rem; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: transform 0.1s ease; }
          .send-btn:active { transform: scale(0.98); }
          .footer { text-align: center; margin-top: 1.25rem; font-size: 0.75rem; color: #64748B; }
          .privacy-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(30, 41, 59, 0.8); padding: 4px 10px; border-radius: 20px; color: #10B981; font-size: 0.75rem; margin-top: 0.75rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="avatar">${avatarInitial}</div>
            <div class="display-name">${safeDisplayName}</div>
            <div class="handle">@${safeHandle}</div>
            <div class="privacy-badge">🔒 100% Anonymous & Encrypted</div>
          </div>
          <div class="prompt-box">
            <div class="prompt-title">Prompt</div>
            <div class="prompt-text">${safePromptQuestion}</div>
          </div>
          <form id="confessionForm" onsubmit="submitForm(event)">
            <textarea id="messageText" placeholder="Send an anonymous confession..." maxlength="500" required></textarea>
            <button type="submit" class="send-btn" id="submitBtn">Send Anonymously 🚀</button>
          </form>
          <div class="footer">
            Powered by <strong>JUSTSAY</strong> • Private & Anonymous
          </div>
        </div>
        <script>
          async function submitForm(e) {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const text = document.getElementById('messageText').value;
            btn.disabled = true;
            btn.innerText = 'Sending...';
            try {
              const res = await fetch('/api/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipientHandle: "${jsSafeHandle}",
                  promptQuestion: "${jsSafePromptQuestion}",
                  messageText: text
                })
              });
              const data = await res.json();
              if (data.success) {
                document.querySelector('.container').innerHTML = \`
                  <div style="text-align: center; padding: 2rem 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                    <h2 style="font-size: 1.5rem; color: #10B981; margin-bottom: 0.5rem;">Confession Sent!</h2>
                    <p style="color: #94A3B8; font-size: 0.95rem; margin-bottom: 1.5rem;">Your message was sent anonymously to @${safeHandle}.</p>
                    <button onclick="location.reload()" style="background: #1E293B; color: white; border: 1px solid #334155; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer;">Send Another</button>
                  </div>
                \`;
              } else {
                alert('Error: ' + (data.error || 'Failed to send message'));
                btn.disabled = false;
                btn.innerText = 'Send Anonymously 🚀';
              }
            } catch(err) {
              alert('Network error. Please try again.');
              btn.disabled = false;
              btn.innerText = 'Send Anonymously 🚀';
            }
          }
        </script>
      </body>
      </html>
    `;
  }
}
