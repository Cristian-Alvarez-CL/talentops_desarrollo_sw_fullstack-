export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  imageUrl?: string;
  tags: string[];
  specifications: Record<string, string>;
}

export interface ApiError {
  field?: string;
  message: string;
  code: string;
}

export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  serverErrors: ApiError[];
  progress: number;
}