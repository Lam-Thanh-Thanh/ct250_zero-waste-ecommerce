import React, { useState } from 'react';
import { Dialog, DialogPanel, Select, SelectItem } from '@tremor/react';
import { toast } from 'react-toastify';
import { exportExcel, exportPdf } from '../../api/dashboardApi';

// ─── EXPORT REPORT DIALOG ────────────────────────────────────────────
// Modal: chọn định dạng (Excel/PDF), Tháng/Năm, rồi tải xuống thật
// Props: isOpen, onClose

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
}));
const YEARS = ['2025', '2026'];

const ExportReportDialog = ({ isOpen, onClose }) => {
    const now = new Date();
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [year, setYear] = useState(String(now.getFullYear()));
    const [format, setFormat] = useState('excel');
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            let blob, filename;

            if (format === 'excel') {
                blob = await exportExcel(month, year);
                filename = `bao-cao-${year}-${month.padStart(2, '0')}.xlsx`;
            } else {
                blob = await exportPdf(month, year);
                filename = `bao-cao-${year}-${month.padStart(2, '0')}.pdf`;
            }

            // Blob → temp URL → <a> click → download → cleanup
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`Xuất ${format === 'excel' ? 'Excel' : 'PDF'} thành công!`);
            onClose();
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Lỗi khi xuất file, vui lòng thử lại');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} static={true}>
            <DialogPanel className="max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                    Tùy chọn xuất báo cáo
                </h3>
                <p className="text-sm text-emerald-600/60 mb-5">
                    Chọn định dạng và khoảng thời gian bạn muốn xuất.
                </p>

                {/* Format selection */}
                <div className="mb-4">
                    <label className="block text-xs font-medium text-emerald-700 mb-1.5">Định dạng</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFormat('excel')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${format === 'excel'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                                    : 'bg-white border-emerald-100 text-emerald-500 hover:bg-emerald-50/50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel (.xlsx)
                        </button>
                        <button
                            onClick={() => setFormat('pdf')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${format === 'pdf'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                                    : 'bg-white border-emerald-100 text-emerald-500 hover:bg-emerald-50/50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF (.pdf)
                        </button>
                    </div>
                </div>

                {/* Month / Year selectors */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-emerald-700 mb-1.5">Tháng</label>
                        <Select value={month} onValueChange={setMonth} placeholder="Chọn tháng">
                            {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-emerald-700 mb-1.5">Năm</label>
                        <Select value={year} onValueChange={setYear} placeholder="Chọn năm">
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={downloading}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-emerald-200
                       text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl
                       bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm
                       disabled:opacity-50"
                    >
                        {downloading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang tải...
                            </>
                        ) : (
                            'Tải xuống'
                        )}
                    </button>
                </div>
            </DialogPanel>
        </Dialog>
    );
};

export default ExportReportDialog;
