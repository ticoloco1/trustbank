import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Defina o seu domínio principal e exceções
  const rootDomain = 'trustbank.xyz';
  const publicPages = ['/auth', '/dashboard', '/editor', '/planos', '/slugs'];

  // 2. Se for o domínio principal ou localhost, não faz nada (segue normal)
  if (
    hostname === rootDomain || 
    hostname === `www.${rootDomain}` || 
    hostname === 'localhost:3000' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. Extrai o subdomínio (ex: 'ary.trustbank.xyz' -> 'ary')
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  // 4. Se o usuário tentar acessar uma página interna via subdomínio (ex: ary.trustbank.xyz/dashboard)
  // Nós mandamos ele de volta para o domínio principal por segurança
  if (publicPages.some(page => url.pathname.startsWith(page))) {
    return NextResponse.redirect(new URL(`https://${rootDomain}${url.pathname}`, request.url));
  }

  // 5. REESCRITA INTERNA
  // O navegador mostra: slug.trustbank.xyz
  // O Next.js busca em: trustbank.xyz/s/slug
  return NextResponse.rewrite(new URL(`/s/${subdomain}${url.pathname}`, request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
