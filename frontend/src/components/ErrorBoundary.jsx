import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
          <div className="text-red-500 mb-4 text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Terjadi Kesalahan Tak Terduga</h1>
          <p className="text-[#8b90b0] mb-6 max-w-md">
            Aplikasi mengalami crash karena error pada komponen ini.
            <br />
            {this.state.error && this.state.error.toString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#e2001a] hover:bg-[#b8001a] text-white rounded-xl transition-colors font-medium"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
