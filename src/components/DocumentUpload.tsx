import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Clock, CheckCircle, XCircle, Trash2, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fileUploadSchema, sanitizeInput, sanitizeFileName, FILE_VALIDATION, createRateLimiter } from "@/lib/validation";

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  document_type: string;
  processing_status: string;
  total_chunks: number;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: "FCOM", label: "Flight Crew Operating Manual" },
  { value: "QRH", label: "Quick Reference Handbook" },
  { value: "FCTM", label: "Flight Crew Training Manual" },
  { value: "MEL", label: "Minimum Equipment List" },
  { value: "AFM", label: "Aircraft Flight Manual" },
  { value: "OTHER", label: "Other Manual" },
];

// Rate limiter: 3 uploads per 10 minutes per user
const uploadRateLimiter = createRateLimiter(3, 10 * 60 * 1000);

export const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fileValidationError, setFileValidationError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: "",
    documentType: "",
    file: null as File | null,
  });

  // Load user's documents
  const loadDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }
  };

  // Enhanced file validation
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type as any)) {
      return 'Only PDF files are allowed';
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension as any)) {
      return 'File must have a .pdf extension';
    }

    // Check file size
    if (file.size > FILE_VALIDATION.MAX_SIZE) {
      return `File size must be less than ${FILE_VALIDATION.MAX_SIZE / 1024 / 1024}MB`;
    }

    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return 'Invalid file name';
    }

    // Basic malware check (check for executable extensions)
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
    if (suspiciousExtensions.some(ext => file.name.toLowerCase().includes(ext))) {
      return 'File contains suspicious content';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileValidationError('');
    
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setFileValidationError(validationError);
        toast({
          title: "Invalid File",
          description: validationError,
          variant: "destructive",
        });
        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      setFormData({ ...formData, file });
      
      // Auto-generate title from filename if not set
      if (!formData.title) {
        const fileName = sanitizeFileName(file.name.replace('.pdf', ''));
        setFormData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  // Upload and process document
  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to upload documents",
        variant: "destructive",
      });
      return;
    }

    // Rate limiting check
    if (!uploadRateLimiter(user.id)) {
      toast({
        title: "Upload Limit Exceeded",
        description: "You can upload up to 3 documents every 10 minutes. Please wait before uploading more.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});
    setFileValidationError('');

    // Validate form data
    const sanitizedTitle = sanitizeInput(formData.title);
    const validation = fileUploadSchema.safeParse({
      title: sanitizedTitle,
      documentType: formData.documentType,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0] as string] = error.message;
        }
      });
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the form errors",
        variant: "destructive",
      });
      return;
    }

    if (!formData.file) {
      setFileValidationError('Please select a file');
      toast({
        title: "Missing File",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    // Re-validate file
    const fileError = validateFile(formData.file);
    if (fileError) {
      setFileValidationError(fileError);
      toast({
        title: "Invalid File",
        description: fileError,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Extract text using Vercel API route
      const formDataForApi = new FormData();
      formDataForApi.append('file', formData.file);

      const extractResponse = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formDataForApi,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.details || 'PDF extraction failed');
      }

      const { content: extractedText, metadata } = await extractResponse.json();
      setUploadProgress(25);

      // Step 2: Upload file to storage with sanitized filename
      const sanitizedFileName = sanitizeFileName(formData.file.name);
      const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, formData.file);

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // Step 3: Create document record with extracted content
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: sanitizedTitle,
          file_name: sanitizeFileName(formData.file.name),
          file_path: fileName,
          file_size: formData.file.size,
          document_type: formData.documentType,
          processing_status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;
      setUploadProgress(75);

      // Step 4: Process extracted text into chunks and embeddings
      setProcessing(document.id);
      const { error: processError } = await supabase.functions.invoke('process-pdf', {
        body: { 
          documentId: document.id,
          extractedText: extractedText,
          metadata: metadata
        },
      });

      if (processError) throw processError;
      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: `${formData.title} is being processed. This may take a few minutes.`,
      });

      // Reset form
      setFormData({ title: "", documentType: "", file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reload documents
      loadDocuments();

    } catch (error: any) {
      // Generic error message for security
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error); // Log for debugging
    } finally {
      setUploading(false);
      setProcessing(null);
      setUploadProgress(0);
    }
  };

  // Delete document
  const handleDelete = async (doc: Document) => {
    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.file_path]);
      
      // Delete from database (cascades to chunks)
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: "Document Deleted",
        description: `${doc.title} has been deleted`,
      });

      loadDocuments();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  // Load documents on mount
  React.useEffect(() => {
    loadDocuments();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Aviation Manual</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., A321 FCOM Rev 2024"
              className={validationErrors.title ? 'border-red-500' : ''}
              disabled={uploading}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="documentType">Document Type</Label>
            <Select 
              value={formData.documentType} 
              onValueChange={(value) => setFormData({ ...formData, documentType: value })}
              disabled={uploading}
            >
              <SelectTrigger className={validationErrors.documentType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.documentType && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.documentType}</p>
            )}
          </div>

          <div>
            <Label htmlFor="file">
              <div className="flex items-center gap-2">
                PDF File
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
            </Label>
            <Input
              id="file"
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className={fileValidationError ? 'border-red-500' : ''}
              disabled={uploading}
            />
            {fileValidationError && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4" />
                {fileValidationError}
              </div>
            )}
            {formData.file && !fileValidationError && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  File validated successfully
                </div>
                <p className="text-green-600 mt-1">
                  {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: {FILE_VALIDATION.MAX_SIZE / 1024 / 1024}MB • Only PDF files allowed
            </p>
          </div>

          {uploading && (
            <div>
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 50 ? 'Uploading...' : 
                 uploadProgress < 75 ? 'Creating record...' : 
                 uploadProgress < 100 ? 'Starting processing...' : 'Complete!'}
              </p>
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={uploading || !formData.file || !formData.title || !formData.documentType}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Processing...' : 'Upload & Process Document'}
          </Button>
        </div>
      </Card>

      {/* Documents List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
        
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No documents uploaded yet. Upload your first aviation manual above.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(doc.processing_status)}
                  <div>
                    <h4 className="font-medium">{doc.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{doc.document_type}</Badge>
                      <span>•</span>
                      <span>{getStatusText(doc.processing_status)}</span>
                      {doc.total_chunks > 0 && (
                        <>
                          <span>•</span>
                          <span>{doc.total_chunks} chunks</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};