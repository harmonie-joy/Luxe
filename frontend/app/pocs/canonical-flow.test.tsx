import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/setup";
import { APP_ROUTES, POC_NAV_ITEMS } from "@/lib/routes";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import SandboxLayout from "./layout";

const location = vi.hoisted(() => ({ pathname: "/pocs/home" }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => location.pathname }));

describe("canonical prototype flow", () => {
  beforeEach(() => { location.pathname = APP_ROUTES.pocsHome; });

  it("uses Page 15 global navigation and gives Home its next stage", () => {
    render(<SandboxLayout><h1>Saved creator work</h1></SandboxLayout>);
    const navigation = within(screen.getByRole("navigation", { name: "Creator navigation" }));
    expect(navigation.getAllByRole("link").map((link) => link.textContent)).toEqual(POC_NAV_ITEMS.map((item) => item.label));
    expect(navigation.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Step 8 of 13")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Continue to Plan/ }));
    expect(router.push).toHaveBeenCalledWith(APP_ROUTES.pocsPlan);
  });

  it("routes Tornado to Home instead of skipping to creation", () => {
    location.pathname = APP_ROUTES.pocsTornadoWorkspace;
    render(<StageFlowFooter prevRoute={APP_ROUTES.pocsImportWorld} nextRoute={APP_ROUTES.pocsContentWorkspace} currentStep={2} totalSteps={5} />);
    fireEvent.click(screen.getByRole("button", { name: /Continue to Home/ }));
    expect(router.push).toHaveBeenCalledWith(APP_ROUTES.pocsHome);
  });

  it("preserves completion guards and extends Library to Impact", () => {
    location.pathname = APP_ROUTES.pocsPostsGallery;
    const view = render(<StageFlowFooter prevRoute={APP_ROUTES.pocsSinglePost} currentStep={5} totalSteps={5} nextDisabled nextHint="Complete the current step" />);
    expect(screen.getByRole("button", { name: /Continue to Impact/ }).hasAttribute("disabled")).toBe(true);
    view.rerender(<StageFlowFooter prevRoute={APP_ROUTES.pocsSinglePost} currentStep={5} totalSteps={5} />);
    fireEvent.click(screen.getByRole("button", { name: /Continue to Impact/ }));
    expect(router.push).toHaveBeenCalledWith(APP_ROUTES.pocsImpact);
  });
});