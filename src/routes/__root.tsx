import { Outlet, createRootRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { COMPANY_NAME } from "@/lib/constants";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const { user, loading } = useAuth();
  const { pathname } = useRouterState({ select: (s) => s.location });

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    // Página de login → renderiza rota normalmente (sem sidebar)
    if (pathname === "/login") {
      return (
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster />
        </QueryClientProvider>
      );
    }
    // Página inicial → landing page pública
    if (pathname === "/") {
      return (
        <QueryClientProvider client={queryClient}>
          <LandingPage />
          <Toaster />
        </QueryClientProvider>
      );
    }
    // Rotas públicas sem sidebar
    if (pathname === "/novidades") {
      return (
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster />
        </QueryClientProvider>
      );
    }
    // Qualquer outra rota protegida → redireciona para login
    return <Navigate to={"/login" as any} />;
  }

  // Autenticado na página de login → redireciona para o dashboard
  if (pathname === "/login") {
    return <Navigate to="/" />;
  }

  // Autenticado → layout completo com sidebar
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col min-w-0">
            <Topbar />
            <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-[1600px]">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
