import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { Button, Tag } from "../components/ui";

const previewData = [
  { id: 1, symbol: "AAPL", type: "BUY", qty: 10, price: 172.50, fee: 1.00, currency: "USD", date: "2026-04-28", status: "SUCCESS" },
  { id: 2, symbol: "TSLA", type: "SELL", qty: 5, price: 180.20, fee: 1.00, currency: "USD", date: "2026-04-28", status: "WARNING", msg: "Duplicate record" },
  { id: 3, symbol: "NVDA", type: "BUY", qty: 2, price: 850.00, fee: 0, currency: "USD", date: "2026-04-27", status: "ERROR", msg: "Missing fee" },
];

export function ImportIBKR() {
  const [step, setStep] = useState(1);
  const [emailContent, setEmailContent] = useState("");

  const handleParse = () => {
    setStep(2);
  };

  const handleConfirm = () => {
    setStep(4);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">IBKR Email Import 邮件导入</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Parse IBKR trade confirmation emails and import trades safely</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-6 shadow-sm">
        <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 1 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>1</div>
          <span className="text-xs font-medium text-center">Paste Email</span>
        </div>
        <div className="w-12 h-0.5 bg-neutral-200 dark:bg-neutral-800" />
        <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 2 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>2</div>
          <span className="text-xs font-medium text-center">Preview Parsed Trades</span>
        </div>
        <div className="w-12 h-0.5 bg-neutral-200 dark:bg-neutral-800" />
        <div className={`flex flex-col items-center flex-1 ${step >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 3 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>3</div>
          <span className="text-xs font-medium text-center">Confirm Import</span>
        </div>
        <div className="w-12 h-0.5 bg-neutral-200 dark:bg-neutral-800" />
        <div className={`flex flex-col items-center flex-1 ${step >= 4 ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 4 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>4</div>
          <span className="text-xs font-medium text-center">Import Result</span>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {step === 1 && (
          <div className="p-6 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer mb-6">
              <UploadCloud className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Upload .txt or .html email file</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Drag and drop your IBKR Trade Confirmation email file here, or click to browse.</p>
            </div>
            
            <div className="w-full max-w-3xl flex items-center gap-4 mb-6 text-neutral-400 dark:text-neutral-600">
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-sm font-medium uppercase tracking-wider">OR PASTE CONTENT</span>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>

            <div className="w-full max-w-3xl">
              <textarea 
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Paste IBKR email content here..."
                className="w-full h-48 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent p-4 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 resize-none font-mono placeholder:font-sans placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-neutral-900 dark:text-neutral-100"
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={handleParse} size="lg" disabled={!emailContent && emailContent.length < 10}>
                  Parse Preview 
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {(step === 2 || step === 3) && (
          <div className="flex flex-col">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> 
                Parsed Trade Preview
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Please review the parsed trades before importing. Found 3 records.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Trade Date</th>
                    <th className="px-6 py-4 font-medium">Symbol</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium text-right">Quantity</th>
                    <th className="px-6 py-4 font-medium text-right">Price</th>
                    <th className="px-6 py-4 font-medium text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {previewData.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.status === "SUCCESS" && (
                          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Ready
                          </div>
                        )}
                        {row.status === "WARNING" && (
                          <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500 text-xs font-medium" title={row.msg}>
                            <AlertTriangle className="w-4 h-4" /> Warning
                          </div>
                        )}
                        {row.status === "ERROR" && (
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500 text-xs font-medium" title={row.msg}>
                            <AlertCircle className="w-4 h-4" /> Error
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">{row.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-neutral-900 dark:text-white">{row.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tag color={row.type === "BUY" ? "green" : "red"}>{row.type}</Tag>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-neutral-900 dark:text-white">{row.qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-900 dark:text-white">${row.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-neutral-900 dark:text-white">${row.fee.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> 1 Valid</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-yellow-500" /> 1 Warning</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-red-500" /> 1 Error</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Cancel</Button>
                {step === 2 ? (
                  <Button onClick={() => setStep(3)}>Proceed</Button>
                ) : (
                  <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white border-0">Confirm Import</Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Import Successful!</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-md">The trade records have been successfully parsed and saved to your portfolio database. Note: errors were skipped.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Records</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">3</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/50">
                <p className="text-xs text-green-600 dark:text-green-500 font-medium">Successfully Imported</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">1</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">Duplicates Skipped</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">1</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50">
                <p className="text-xs text-red-600 dark:text-red-500 font-medium">Failed Records</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">1</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>Import Another</Button>
              <Button onClick={() => window.location.href='/trades'}>View Trades 交易记录</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
