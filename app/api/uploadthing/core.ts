import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  photoUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ file }) => {
      console.log('Upload complete:', file.name);
      
      // Return the file info
      return { 
        key: file.key,
        url: file.url,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
