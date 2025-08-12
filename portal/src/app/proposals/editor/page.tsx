"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button, Space, Typography } from "antd";

const DEFAULT_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>Proposal</title></head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>Proposal Draft</h1>
  <p>Start editing on the left. This preview updates live.</p>
</body></html>`;

export default function ProposalEditorPage() {
  const [html, setHtml] = useState<string>(DEFAULT_HTML);

  return (
    <div className="h-[calc(100vh-40px)] p-4">
      <Space direction="vertical" className="w-full">
        <Typography.Title level={3}>Proposal Editor</Typography.Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[80vh]">
          <div className="border rounded overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={html}
              onChange={(v) => setHtml(v || "")}
              options={{ minimap: { enabled: false } }}
            />
          </div>
          <div className="border rounded overflow-hidden">
            <iframe
              className="w-full h-full"
              sandbox="allow-same-origin"
              srcDoc={html}
              title="preview"
            />
          </div>
        </div>
        <Space>
          <Button type="primary" href="/">Back Home</Button>
        </Space>
      </Space>
    </div>
  );
}


