import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Middleware Error: Supabase env vars are missing.');
      // Permite o app continuar sem travar, mas não autentica.
      return supabaseResponse;
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const publicRoutes = [
      '/login',
      '/cadastro',
      '/aguardando',
      '/forgot-password',
      '/update-password',
      '/auth/callback',
      '/api/register',
      '/api/webhooks',
    ]
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // Se o Supabase redirecionar pro site principal com um código de autenticação
    if (request.nextUrl.searchParams.has('code') && !request.nextUrl.pathname.startsWith('/auth/callback')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/callback'
      if (!url.searchParams.has('next')) {
        url.searchParams.set('next', '/update-password')
      }
      return NextResponse.redirect(url)
    }

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && request.nextUrl.pathname.startsWith('/admin')) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware Exception:', error);
    // Se estourar erro, apenas permite passar para não dar 500 no site inteiro
    return NextResponse.next({ request });
  }
}
