import { customAPI } from './customClient';

// Custom integration functions
export const Core = {
  InvokeLLM: async (data) => {
    return customAPI.request('/integrations/llm', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  SendEmail: async (data) => {
    return customAPI.request('/integrations/email', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  UploadFile: async (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    return customAPI.request('/integrations/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type header to let browser set it
    });
  },
  
  GenerateImage: async (data) => {
    return customAPI.request('/integrations/generate-image', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  ExtractDataFromUploadedFile: async (data) => {
    return customAPI.request('/integrations/extract-data', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  CreateFileSignedUrl: async (data) => {
    return customAPI.request('/integrations/signed-url', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  UploadPrivateFile: async (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    return customAPI.request('/integrations/upload-private', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type header to let browser set it
    });
  }
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;






