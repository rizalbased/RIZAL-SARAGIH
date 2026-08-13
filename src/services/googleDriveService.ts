import { DriveFolder, DriveFile, DocCategory } from '../types';
import { INITIAL_DOC_FOLDERS, INITIAL_DOC_FILES } from '../data/mockData';

// Local storage key for persistent drive metadata
const STORAGE_FOLDERS_KEY = 'mkverse_drive_folders_v1';
const STORAGE_FILES_KEY = 'mkverse_drive_files_v1';

class GoogleDriveService {
  private folders: DriveFolder[] = [];
  private files: DriveFile[] = [];

  constructor() {
    this.loadStorage();
  }

  private loadStorage() {
    const savedFolders = localStorage.getItem(STORAGE_FOLDERS_KEY);
    const savedFiles = localStorage.getItem(STORAGE_FILES_KEY);

    if (savedFolders) {
      try {
        this.folders = JSON.parse(savedFolders);
      } catch {
        this.folders = [...INITIAL_DOC_FOLDERS];
      }
    } else {
      this.folders = [...INITIAL_DOC_FOLDERS];
      this.saveStorage();
    }

    if (savedFiles) {
      try {
        this.files = JSON.parse(savedFiles);
      } catch {
        this.files = [...INITIAL_DOC_FILES];
      }
    } else {
      this.files = [...INITIAL_DOC_FILES];
      this.saveStorage();
    }
  }

  private saveStorage() {
    localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(this.folders));
    localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(this.files));
  }

  public async getFolders(): Promise<DriveFolder[]> {
    return [...this.folders];
  }

  public async getFolderById(folderId: string): Promise<DriveFolder | undefined> {
    return this.folders.find(f => f.id === folderId);
  }

  public async getFiles(folderId?: string, category?: DocCategory): Promise<DriveFile[]> {
    let result = [...this.files];
    if (folderId) {
      result = result.filter(f => f.driveFolderId === folderId);
    }
    if (category) {
      result = result.filter(f => f.category === category);
    }
    return result;
  }

  public async getFile(fileId: string): Promise<DriveFile | undefined> {
    return this.files.find(f => f.id === fileId || f.driveFileId === fileId);
  }

  public async getThumbnail(fileId: string): Promise<string> {
    const file = await this.getFile(fileId);
    return file?.thumbnailUrl || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=300';
  }

  public async createFolder(name: string, category: DocCategory, coverUrl?: string): Promise<DriveFolder> {
    const newFolder: DriveFolder = {
      id: `fld_${Date.now()}`,
      name,
      category,
      eventDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      itemCount: 0,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600'
    };
    this.folders.unshift(newFolder);
    this.saveStorage();
    return newFolder;
  }

  public async uploadFile(
    filename: string,
    category: DocCategory,
    driveFolderId: string,
    originalUrl: string,
    event?: string,
    sizeFormatted = '2.5 MB'
  ): Promise<DriveFile> {
    const newFile: DriveFile = {
      id: `file_${Date.now()}`,
      driveFileId: `drv_${Math.random().toString(36).substr(2, 9)}`,
      driveFolderId,
      filename,
      category,
      event: event || category,
      mimeType: 'image/jpeg',
      thumbnailUrl: originalUrl,
      originalUrl,
      createdAt: new Date().toISOString().split('T')[0],
      sizeFormatted
    };

    this.files.unshift(newFile);

    // Update folder item count
    const folderIndex = this.folders.findIndex(f => f.id === driveFolderId);
    if (folderIndex !== -1) {
      this.folders[folderIndex].itemCount += 1;
    }

    this.saveStorage();
    return newFile;
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    const fileToDelete = this.files.find(f => f.id === fileId);
    if (!fileToDelete) return false;

    this.files = this.files.filter(f => f.id !== fileId);

    // Update folder count
    const folderIndex = this.folders.findIndex(f => f.id === fileToDelete.driveFolderId);
    if (folderIndex !== -1 && this.folders[folderIndex].itemCount > 0) {
      this.folders[folderIndex].itemCount -= 1;
    }

    this.saveStorage();
    return true;
  }

  public async updateFileMetadata(fileId: string, metadata: Partial<DriveFile>): Promise<DriveFile | null> {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) return null;

    this.files[index] = { ...this.files[index], ...metadata };
    this.saveStorage();
    return this.files[index];
  }

  public async getStorageStats() {
    const totalFiles = this.files.length;
    const totalFolders = this.folders.length;
    const estimatedUsedMB = (totalFiles * 2.8).toFixed(1);
    return {
      totalFiles,
      totalFolders,
      estimatedUsedMB: `${estimatedUsedMB} MB`,
      limitGB: '100 GB (Google Workspace for Education)',
      status: 'Connected to SMK Multi Karya Drive Storage'
    };
  }
}

export const googleDriveService = new GoogleDriveService();
