"use client";

import { PostsGallery } from "@/app/pocs/components/posts-gallery";
import { mockPostsGallery } from "@/lib/mock-data/pocs-data";

export default function PostsGalleryPage() {
  return <PostsGallery initialPosts={mockPostsGallery} />;
}