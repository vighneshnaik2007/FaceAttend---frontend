'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, FileText, Upload, X } from 'lucide-react';
import { apiCreateCondonationRequest, apiUploadCondonationDocument } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

interface CondonationModalProps {
  usn: string;
  subjectCode: string;
  subjectName: string;
  disabled?: boolean;
  onSubmitted?: () => void;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isImage(file: File) {
  return file.type === 'image/jpeg' || file.type === 'image/png';
}

export function CondonationModal({
  usn,
  subjectCode,
  subjectName,
  disabled,
  onSubmitted,
}: CondonationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDocumentCount, setSubmittedDocumentCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState('');

  const previews = useMemo(
    () =>
      files.map((file) => ({
        key: fileKey(file),
        file,
        url: isImage(file) ? URL.createObjectURL(file) : '',
      })),
    [files],
  );

  const validateAndAddFiles = (incoming: FileList | File[]) => {
    setFileError('');
    const selected = Array.from(incoming);
    if (files.length + selected.length > MAX_FILES) {
      setFileError('Maximum 5 documents allowed');
      return;
    }

    for (const file of selected) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setFileError('Only PDF, JPG and PNG files are allowed');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File ${file.name} exceeds 5MB limit`);
        return;
      }
    }

    setFiles((prev) => {
      const existing = new Set(prev.map(fileKey));
      return [...prev, ...selected.filter((file) => !existing.has(fileKey(file)))].slice(0, MAX_FILES);
    });
  };

  const removeFile = (key: string) => {
    setFiles((prev) => prev.filter((file) => fileKey(file) !== key));
  };

  const resetForm = () => {
    setReason('');
    setDetails('');
    setFiles([]);
    setFileError('');
    setUploadProgress('');
    setSubmitted(false);
    setSubmittedDocumentCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!reason) {
      alert('Please select a reason');
      return;
    }

    setLoading(true);
    setUploadProgress('');
    try {
      const documentUrls: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        setUploadProgress(`Uploading documents ${index + 1} of ${files.length}...`);
        const upload = await apiUploadCondonationDocument({
          usn: usn.toUpperCase(),
          subject_code: subjectCode.toUpperCase(),
          file: files[index],
        });
        documentUrls.push(upload.url);
      }

      await apiCreateCondonationRequest({
        usn: usn.toUpperCase(),
        subject_code: subjectCode.toUpperCase(),
        reason,
        supporting_details: details,
        document_urls: documentUrls,
      });

      setSubmittedDocumentCount(documentUrls.length);
      setSubmitted(true);
      onSubmitted?.();
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 2400);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          Apply for Condonation
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Condonation</DialogTitle>
          <DialogDescription>
            Submit a request for this subject for teacher review.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl text-emerald-700 dark:text-emerald-300">✓</span>
            </div>
            <p className="font-medium text-[#1E293B] dark:text-slate-100">
              Request submitted with {submittedDocumentCount} documents attached
            </p>
            <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
              Request submitted — awaiting teacher approval
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 dark:bg-amber-950/40 dark:border-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">{subjectName}</p>
                <p className="text-xs mt-1">Your attendance is below 75% in this subject.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] dark:text-slate-100 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subjectName}
                readOnly
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#64748B] text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] dark:text-slate-100 mb-2">
                Reason for Condonation <span className="text-red-500">*</span>
              </label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                  <SelectItem value="Family Emergency">Family Emergency</SelectItem>
                  <SelectItem value="College Event Participation">
                    College Event Participation
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] dark:text-slate-100 mb-2">
                Supporting Details
              </label>
              <Textarea
                placeholder="Provide details about your condonation request..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm min-h-[100px] dark:border-slate-800"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] dark:text-slate-100">
                  Supporting Documents (Optional)
                </label>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                  Attach up to 5 files. Accepted formats: PDF, JPG, PNG. Max 5MB each.
                </p>
              </div>

              <button
                type="button"
                className={cn(
                  'flex min-h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-6 text-center text-sm text-[#64748B] transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                  loading && 'pointer-events-none opacity-60',
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  validateAndAddFiles(event.dataTransfer.files);
                }}
              >
                <Upload className="mb-2 h-6 w-6" />
                Click to upload or drag and drop
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  if (event.target.files) validateAndAddFiles(event.target.files);
                  event.target.value = '';
                }}
              />

              {fileError && <p className="text-sm text-red-600">{fileError}</p>}

              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previews.map(({ key, file, url }) => (
                    <div
                      key={key}
                      className="flex max-w-full items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      {isImage(file) ? (
                        <img src={url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <FileText className="h-5 w-5 text-red-600" />
                      )}
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#64748B] hover:text-red-600"
                        onClick={() => removeFile(key)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadProgress && <p className="text-sm font-medium text-[#7C3AED]">{uploadProgress}</p>}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !reason}
                className={cn(loading && 'opacity-70')}
              >
                {loading ? uploadProgress || 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
