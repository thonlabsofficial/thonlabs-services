import { EmailTemplate, EmailTemplates } from '@prisma/client';

const emailTemplatesMapper: {
  [key in EmailTemplates]: Partial<
    Omit<EmailTemplate, 'content' | 'fromName'>
  > & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any;
  };
} = {
  [EmailTemplates.MagicLink]: {
    name: 'Magic Login',
    subject: 'Your Login Access Link For <%= environment.project.appName %>',
    preview: 'Use the link to access the platform',
    fromEmail: 'security',
    content: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"><% if (preview) { %><%= preview %><div style="display:none;opacity:0;overflow:hidden;height:0;width:0;max-height:0;max-width:0;font-size:1px;line-height:1px">‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ </div><% } %></div><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /></head><body style="font-family:sans-serif;margin:0px;background-color:#f4f4f5;color:#09090b;padding:16px;"><a href="https://thonlabs.io" haslink="true" contenteditable="true" imagealign="center" target="_blank" rel="noopener noreferrer nofollow"><img src="https://thonlabs.io/thon-labs-logo-light.png" style="display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px" imagealign="center" haslink="false" contenteditable="false" draggable="true" class=""></a><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><table id="container-zygzbk0qci" align="center" style="border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;"><tr><td style="padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;"><div></div><h4 style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:24px;font-weight:700;line-height:2rem;margin-top:8px;margin-bottom:8px;">Your Login Link</h4><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">You can safely complete your login by clicking on button below.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><div style="margin-top:4px;margin-bottom:4px;null"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/magic/<%= token %>" buttonlinkalign="left" haslink="true" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;color:#fff;text-decoration:none;vertical-align:middle;white-space:nowrap;border-radius:6px;font-size:14px;line-height:20px;font-weight:700;text-decoration-line:none;background-color:#15172a;display:inline-block;box-shadow:0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0,0,0,0.1), 0 1px 2px -1px rgb(0,0,0,0.1);height:46px;padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px;box-sizing:border-box">Complete Login</a></div><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">In case of the button not works, you can login through the link:</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/magic/<%= token %>" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;"><%= environment.appURL %>/auth/magic/<%= token %></a></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">If you didn't initiate this login request, please disregard this message or contact our security team on <a target="_blank" rel="noopener noreferrer nofollow" href="mailto:security@thonlabs.io" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;">security@thonlabs.io</a>.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><strong><%= environment.project.appName %> Team</strong></p></td></tr></table></body></html>`,
    contentJSON: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            rel: 'noopener noreferrer nofollow',
            src: null,
            href: 'https://thonlabs.io',
            style: null,
            title: null,
            target: '_blank',
            hasLink: true,
            imageAlign: 'center',
            imageAttrs: {
              src: 'https://thonlabs.io/thon-labs-logo-light.png',
              class: '',
              style:
                'display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px',
              haslink: 'false',
              draggable: 'true',
              imagealign: 'center',
              contenteditable: 'false',
            },
          },
        },
        { type: 'paragraph', attrs: { textAlign: 'left' } },
        {
          type: 'container',
          attrs: {
            id: 'container-zygzbk0qci',
            style:
              'border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;',
            tdStyle:
              'padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;',
            containerId: 'container-zygzbk0qci',
          },
          content: [
            { type: 'empty' },
            {
              type: 'heading',
              attrs: { level: 4, textAlign: 'left' },
              content: [{ text: 'Your Login Link', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋',
                  type: 'text',
                },
              ],
            },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'You can safely complete your login by clicking on button below.',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'buttonLink',
              attrs: {
                rel: 'noopener noreferrer nofollow',
                href: '<%= environment.appURL %>/auth/magic/<%= token %>',
                class: null,
                style: null,
                target: '_blank',
                hasLink: true,
                buttonLinkAlign: 'left',
              },
              content: [{ text: 'Complete Login', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'In case of the button not works, you can login through the link:',
                  type: 'text',
                },
              ],
            },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.appURL %>/auth/magic/<%= token %>',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: '<%= environment.appURL %>/auth/magic/<%= token %>',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: "If you didn't initiate this login request, please disregard this message or contact our security team on ",
                  type: 'text',
                },
                {
                  text: 'security@thonlabs.io',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: 'mailto:security@thonlabs.io',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
                { text: '.', type: 'text' },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.project.appName %> Team',
                  type: 'text',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
          ],
        },
      ],
    },
    bodyStyles: { color: '#09090b', padding: 16, backgroundColor: '#f4f4f5' },
  },
  [EmailTemplates.ConfirmEmail]: {
    name: 'Confirm Email',
    subject: 'Confirm Your Email For <%= environment.project.appName %>',
    preview: 'Use the link to confirm your email',
    fromEmail: 'security',
    content: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"><% if (preview) { %><%= preview %><div style="display:none;opacity:0;overflow:hidden;height:0;width:0;max-height:0;max-width:0;font-size:1px;line-height:1px">‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ </div><% } %></div><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /></head><body style="font-family:sans-serif;margin:0px;background-color:#f4f4f5;color:#09090b;padding:16px;"><a href="https://thonlabs.io" haslink="true" contenteditable="true" imagealign="center" target="_blank" rel="noopener noreferrer nofollow"><img src="https://thonlabs.io/thon-labs-logo-light.png" class="" style="display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px" haslink="false" draggable="true" imagealign="center" contenteditable="false"></a><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><table id="container-767azcugo8x" align="center" style="border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); border-radius: 8px; max-width: 600px;"><tr><td style="padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;"><div></div><h4 style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:24px;font-weight:700;line-height:2rem;margin-top:8px;margin-bottom:8px;">Confirm Your Email</h4><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">We've received a request to sign up for <%= environment.project.appName %> using this email address. To complete the registration process, kindly confirm your email by clicking on the button below.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><div style="margin-top:4px;margin-bottom:4px;null"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/confirm-email/<%= token %>" buttonlinkalign="left" haslink="true" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;color:#fff;text-decoration:none;vertical-align:middle;white-space:nowrap;border-radius:6px;font-size:14px;line-height:20px;font-weight:700;text-decoration-line:none;background-color:#15172a;display:inline-block;box-shadow:0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0,0,0,0.1), 0 1px 2px -1px rgb(0,0,0,0.1);height:46px;padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px;box-sizing:border-box">Confirm Email</a></div><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">In case of the button not works, you can confirm through the link:</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/confirm-email/<%= token %>" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;"><%= environment.appURL %>/auth/confirm-email/<%= token %></a></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">If you didn't initiate this sign-up request, please disregard this message or contact our security team <a target="_blank" rel="noopener noreferrer nofollow" href="mailto:security@thonlabs.io" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;">security@thonlabs.io</a>.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><strong><%= environment.project.appName %> Team</strong></p></td></tr></table></body></html>`,
    contentJSON: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            rel: 'noopener noreferrer nofollow',
            src: null,
            href: 'https://thonlabs.io',
            style: null,
            title: null,
            target: '_blank',
            hasLink: true,
            imageAlign: 'center',
            imageAttrs: {
              src: 'https://thonlabs.io/thon-labs-logo-light.png',
              class: '',
              style:
                'display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px',
              haslink: 'false',
              draggable: 'true',
              imagealign: 'center',
              contenteditable: 'false',
            },
          },
        },
        { type: 'paragraph', attrs: { textAlign: 'left' } },
        {
          type: 'container',
          attrs: {
            id: 'container-767azcugo8x',
            style:
              'border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); border-radius: 8px; max-width: 600px;',
            tdStyle:
              'padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;',
            containerId: 'container-767azcugo8x',
          },
          content: [
            { type: 'empty' },
            {
              type: 'heading',
              attrs: { level: 4, textAlign: 'left' },
              content: [{ text: 'Confirm Your Email', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: "We've received a request to sign up for <%= environment.project.appName %> using this email address. To complete the registration process, kindly confirm your email by clicking on the button below.",
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'buttonLink',
              attrs: {
                rel: 'noopener noreferrer nofollow',
                href: '<%= environment.appURL %>/auth/confirm-email/<%= token %>',
                class: null,
                style: null,
                target: '_blank',
                hasLink: true,
                buttonLinkAlign: 'left',
              },
              content: [{ text: 'Confirm Email', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'In case of the button not works, you can confirm through the link:',
                  type: 'text',
                },
              ],
            },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.appURL %>/auth/confirm-email/<%= token %>',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: '<%= environment.appURL %>/auth/confirm-email/<%= token %>',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: "If you didn't initiate this sign-up request, please disregard this message or contact our security team ",
                  type: 'text',
                },
                {
                  text: 'security@thonlabs.io',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: 'mailto:security@thonlabs.io',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
                { text: '.', type: 'text' },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.project.appName %> Team',
                  type: 'text',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
          ],
        },
      ],
    },
    bodyStyles: { color: '#09090b', padding: 16, backgroundColor: '#f4f4f5' },
  },
  [EmailTemplates.ForgotPassword]: {
    name: 'Forgot Password',
    subject:
      'Reset Your Account Password For <%= environment.project.appName %>',
    preview: 'Use the link to reset your password',
    fromEmail: 'security',
    content: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"><% if (preview) { %><%= preview %><div style="display:none;opacity:0;overflow:hidden;height:0;width:0;max-height:0;max-width:0;font-size:1px;line-height:1px">‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ </div><% } %></div><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /></head><body style="font-family:sans-serif;margin:0px;background-color:#f4f4f5;color:#09090b;padding:16px;"><a href="https://thonlabs.io" haslink="true" contenteditable="true" imagealign="center" target="_blank" rel="noopener noreferrer nofollow"><img src="https://thonlabs.io/thon-labs-logo-light.png" style="display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px" imagealign="center" haslink="false" contenteditable="false" draggable="true" class=""></a><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><table id="container-v9rj5b3qer" align="center" style="border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;"><tr><td style="padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;"><h4 style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:24px;font-weight:700;line-height:2rem;margin-top:8px;margin-bottom:8px;">Reset Your Account Password</h4><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">We received a recent request to reset the password for your account. To proceed with the password reset, kindly click on the button provided below.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><div style="margin-top:4px;margin-bottom:4px;null"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/reset-password/<%= token %>" buttonlinkalign="left" haslink="true" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;color:#fff;text-decoration:none;vertical-align:middle;white-space:nowrap;border-radius:6px;font-size:14px;line-height:20px;font-weight:700;text-decoration-line:none;background-color:#15172a;display:inline-block;box-shadow:0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0,0,0,0.1), 0 1px 2px -1px rgb(0,0,0,0.1);height:46px;padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px;box-sizing:border-box">Reset Password</a></div><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">In case of the button not works, you can reset the password through the link:</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/reset-password/<%= token %>" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;"><%= environment.appURL %>/auth/reset-password/<%= token %></a></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">If you didn't initiate this reset password request, please disregard this message or contact our security team on <a target="_blank" rel="noopener noreferrer nofollow" href="mailto:security@thonlabs.io" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;">security@thonlabs.io</a>.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><strong><%= environment.project.appName %> Team</strong></p><div></div></td></tr></table></body></html>`,
    contentJSON: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            rel: 'noopener noreferrer nofollow',
            src: null,
            href: 'https://thonlabs.io',
            style: null,
            title: null,
            target: '_blank',
            hasLink: true,
            imageAlign: 'center',
            imageAttrs: {
              src: 'https://thonlabs.io/thon-labs-logo-light.png',
              class: '',
              style:
                'display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px',
              haslink: 'false',
              draggable: 'true',
              imagealign: 'center',
              contenteditable: 'false',
            },
          },
        },
        { type: 'paragraph', attrs: { textAlign: 'left' } },
        {
          type: 'container',
          attrs: {
            id: 'container-v9rj5b3qer',
            style:
              'border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;',
            tdStyle:
              'padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;',
            containerId: 'container-v9rj5b3qer',
          },
          content: [
            {
              type: 'heading',
              attrs: { level: 4, textAlign: 'left' },
              content: [{ text: 'Reset Your Account Password', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'We received a recent request to reset the password for your account. To proceed with the password reset, kindly click on the button provided below.',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'buttonLink',
              attrs: {
                rel: 'noopener noreferrer nofollow',
                href: '<%= environment.appURL %>/auth/reset-password/<%= token %>',
                class: null,
                style: null,
                target: '_blank',
                hasLink: true,
                buttonLinkAlign: 'left',
              },
              content: [{ text: 'Reset Password', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'In case of the button not works, you can reset the password through the link:',
                  type: 'text',
                },
              ],
            },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.appURL %>/auth/reset-password/<%= token %>',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: '<%= environment.appURL %>/auth/reset-password/<%= token %>',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: "If you didn't initiate this reset password request, please disregard this message or contact our security team on ",
                  type: 'text',
                },
                {
                  text: 'security@thonlabs.io',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: 'mailto:security@thonlabs.io',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
                { text: '.', type: 'text' },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.project.appName %> Team',
                  type: 'text',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
            { type: 'empty' },
          ],
        },
      ],
    },
    bodyStyles: { color: '#09090b', padding: 16, backgroundColor: '#f4f4f5' },
  },
  [EmailTemplates.Welcome]: {
    name: 'Welcome',
    subject: 'Welcome to <%= environment.project.appName %>!',
    preview: 'Some words from founder',
    fromEmail: 'hello',
    content: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"><% if (preview) { %><%= preview %><div style="display:none;opacity:0;overflow:hidden;height:0;width:0;max-height:0;max-width:0;font-size:1px;line-height:1px">‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ </div><% } %></div><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /></head><body style="font-family:sans-serif;margin:0px;background-color:#f4f4f5;color:#09090b;padding:16px;"><a href="https://thonlabs.io" haslink="true" contenteditable="true" imagealign="center" target="_blank" rel="noopener noreferrer nofollow"><img src="https://thonlabs.io/thon-labs-logo-light.png" style="display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px" imagealign="center" haslink="false" contenteditable="false" draggable="true" class=""></a><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><table id="container-4aosud24s3" align="center" style="border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;"><tr><td style="padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;"><div></div><h4 style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:24px;font-weight:700;line-height:2rem;margin-top:8px;margin-bottom:8px;">Welcome to <%= environment.project.appName %></h4><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">My name is Gustavo the founder of <%= environment.project.appName %>, but you can call me Gus. I'm thrilled to welcome you aboard. Thank you for choosing us as your partner.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><%= environment.project.appName %> is an all-in-one platform that establishes the foundation for any SaaS product, allowing founders and software engineers to focus on what truly matters: their own product development.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">If you have any questions, feel free to reply to this email.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">Best regards,</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><strong>Gus from <%= environment.project.appName %></strong></p></td></tr></table></body></html>`,
    contentJSON: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            rel: 'noopener noreferrer nofollow',
            src: null,
            href: 'https://thonlabs.io',
            style: null,
            title: null,
            target: '_blank',
            hasLink: true,
            imageAlign: 'center',
            imageAttrs: {
              src: 'https://thonlabs.io/thon-labs-logo-light.png',
              class: '',
              style:
                'display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px',
              haslink: 'false',
              draggable: 'true',
              imagealign: 'center',
              contenteditable: 'false',
            },
          },
        },
        { type: 'paragraph', attrs: { textAlign: 'left' } },
        {
          type: 'container',
          attrs: {
            id: 'container-4aosud24s3',
            style:
              'border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;',
            tdStyle:
              'padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;',
            containerId: 'container-4aosud24s3',
          },
          content: [
            { type: 'empty' },
            {
              type: 'heading',
              attrs: { level: 4, textAlign: 'left' },
              content: [
                {
                  text: 'Welcome to <%= environment.project.appName %>',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: "My name is Gustavo the founder of <%= environment.project.appName %>, but you can call me Gus. I'm thrilled to welcome you aboard. Thank you for choosing us as your partner.",
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.project.appName %> is an all-in-one platform that establishes the foundation for any SaaS product, allowing founders and software engineers to focus on what truly matters: their own product development.',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'If you have any questions, feel free to reply to this email.',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [{ text: 'Best regards,', type: 'text' }],
            },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'Gus from <%= environment.project.appName %>',
                  type: 'text',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
          ],
        },
      ],
    },
    bodyStyles: { color: '#09090b', padding: 16, backgroundColor: '#f4f4f5' },
  },
  [EmailTemplates.Invite]: {
    name: 'Invite User',
    subject: "You're invited to join <%= environment.project.appName %>!",
    preview: 'Use the link to join the platform',
    fromEmail: 'security',
    content: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"><% if (preview) { %><%= preview %><div style="display:none;opacity:0;overflow:hidden;height:0;width:0;max-height:0;max-width:0;font-size:1px;line-height:1px">‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌<wbr /> ‌ ‌ ‌ ‌ ‌ </div><% } %></div><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /></head><body style="font-family:sans-serif;margin:0px;background-color:#f4f4f5;color:#09090b;padding:16px;"><a href="https://thonlabs.io" haslink="true" contenteditable="true" imagealign="center" target="_blank" rel="noopener noreferrer nofollow"><img src="https://thonlabs.io/thon-labs-logo-light.png" style="display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px" imagealign="center" haslink="false" contenteditable="false" draggable="true" class=""></a><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><table id="container-am1cqpbg37b" align="center" style="border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;"><tr><td style="padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;"><div></div><h4 style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:24px;font-weight:700;line-height:2rem;margin-top:8px;margin-bottom:8px;">You're invited to join <%= environment.project.appName %>!</h4><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><%= inviter.fullName %> (<%= inviter.email %>) invited you to join the team.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><%= environment.project.appName %> is an all-in-one platform that establishes the foundation for any SaaS product, allowing founders and software engineers to focus on what truly matters: their own product development.</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><div style="margin-top:4px;margin-bottom:4px;null"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/confirm-email/<%= token %>" buttonlinkalign="left" haslink="true" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;color:#fff;text-decoration:none;vertical-align:middle;white-space:nowrap;border-radius:6px;font-size:14px;line-height:20px;font-weight:700;text-decoration-line:none;background-color:#15172a;display:inline-block;box-shadow:0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0,0,0,0.1), 0 1px 2px -1px rgb(0,0,0,0.1);height:46px;padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px;box-sizing:border-box">Accept Invitation</a></div><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;">In case of the button not works, you can accept the invite through the link:</p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><a target="_blank" rel="noopener noreferrer nofollow" href="<%= environment.appURL %>/auth/confirm-email/<%= token %>" style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;text-decoration:underline;color:#3b82f6;"><%= environment.appURL %>/auth/confirm-email/<%= token %></a></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"></p><p style="font-family:ui-sanserif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;line-height:1.625;color:inherit;font-size:inherit;margin-top:4px;margin-bottom:4px;min-height:16px;"><strong><%= environment.project.appName %> Team</strong></p></td></tr></table></body></html>`,
    contentJSON: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            rel: 'noopener noreferrer nofollow',
            src: null,
            href: 'https://thonlabs.io',
            style: null,
            title: null,
            target: '_blank',
            hasLink: true,
            imageAlign: 'center',
            imageAttrs: {
              src: 'https://thonlabs.io/thon-labs-logo-light.png',
              class: '',
              style:
                'display: block; outline: none; border: none; text-decoration: none; margin: 8px auto; width: 133px; height: 18.5581px; margin-top: 8px; margin-bottom: 8px',
              haslink: 'false',
              draggable: 'true',
              imagealign: 'center',
              contenteditable: 'false',
            },
          },
        },
        { type: 'paragraph', attrs: { textAlign: 'left' } },
        {
          type: 'container',
          attrs: {
            id: 'container-am1cqpbg37b',
            style:
              'border-collapse: separate; width: 100%; margin: 8px auto; background-color: rgb(250, 250, 250); max-width: 600px; border-radius: 8px;',
            tdStyle:
              'padding-top: 10px;padding-bottom: 10px;padding-left: 10px;padding-right: 10px;',
            containerId: 'container-am1cqpbg37b',
          },
          content: [
            { type: 'empty' },
            {
              type: 'heading',
              attrs: { level: 4, textAlign: 'left' },
              content: [
                {
                  text: "You're invited to join <%= environment.project.appName %>!",
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'Hey <% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>! 👋',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= inviter.fullName %> (<%= inviter.email %>) invited you to join the team.',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.project.appName %> is an all-in-one platform that establishes the foundation for any SaaS product, allowing founders and software engineers to focus on what truly matters: their own product development.',
                  type: 'text',
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'buttonLink',
              attrs: {
                rel: 'noopener noreferrer nofollow',
                href: '<%= environment.appURL %>/auth/confirm-email/<%= token %>',
                class: null,
                style: null,
                target: '_blank',
                hasLink: true,
                buttonLinkAlign: 'left',
              },
              content: [{ text: 'Accept Invitation', type: 'text' }],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: 'In case of the button not works, you can accept the invite through the link:',
                  type: 'text',
                },
              ],
            },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.appURL %>/auth/confirm-email/<%= token %>',
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        rel: 'noopener noreferrer nofollow',
                        href: '<%= environment.appURL %>/auth/confirm-email/<%= token %>',
                        class: null,
                        target: '_blank',
                      },
                    },
                  ],
                },
              ],
            },
            { type: 'paragraph', attrs: { textAlign: 'left' } },
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  text: '<%= environment.project.appName %> Team',
                  type: 'text',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
          ],
        },
      ],
    },
    bodyStyles: { color: '#09090b', padding: 16, backgroundColor: '#f4f4f5' },
  },
};

export default emailTemplatesMapper;
