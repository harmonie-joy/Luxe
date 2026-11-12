"use client";

import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { SinglePostWorkspace } from "@/features/single-post/components/single-post-workspace";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import styles from "@/features/single-post/components/single-post.module.css";

export default function SinglePostPage() {
  return (
    <div className={styles.route}>
      <SinglePostWorkspace data={mockSinglePostLoop} />
      <StageFlowFooter
        currentStep={4}
        nextLabel="Open Posts Gallery"
        nextRoute={APP_ROUTES.pocsPostsGallery}
        prevRoute={APP_ROUTES.pocsContentWorkspace}
        totalSteps={5}
      />
    </div>
  );
}