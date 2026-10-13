import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Unhandled Application Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-white px-6 text-center text-black">
          <div className="max-w-md space-y-4">
            <h1 className="font-display text-2xl">ĐÃ XẢY RA LỖI TẢI TRANG</h1>
            <p className="text-xs text-neutral-600">Hệ thống đang gặp sự cố hiển thị. Vui lòng tải lại trang để thử lại.</p>
            <button
              type="button"
              className="pill-button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Tải lại trang
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
