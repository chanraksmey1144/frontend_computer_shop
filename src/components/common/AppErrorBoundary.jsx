import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
          <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Page error</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">This page could not load</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              An unexpected page error occurred. Reload the page to try again, or return to the store.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Reload page
              </button>
              <a
                href="/"
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back to store
              </a>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
