export interface Document {
  id: string;
  title: string;
  content: string;
  mode: 'word' | 'powerpoint';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  projectId: string;
}

export interface CodeProject {
  id: string;
  name: string;
  files: CodeFile[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
