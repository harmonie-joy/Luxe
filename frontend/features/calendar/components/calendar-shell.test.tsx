import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { mockCalendarPage } from "@/data/mock-calendar";
import { CalendarShell } from "@/features/calendar/components/calendar-shell";

const [firstItem, secondItem] = mockCalendarPage.scheduledContent;

function draftTitle(draftId: string): string {
  const draft = mockCalendarPage.drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error(`Missing mock draft ${draftId}`);
  return draft.title;
}

describe("CalendarShell", () => {
  it("shows the detail pane for the newly selected scheduled item", async () => {
    const user = userEvent.setup();
    render(<CalendarShell data={mockCalendarPage} />);

    // First item selected by default in the detail pane.
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: draftTitle(firstItem.draftId),
      }),
    ).toBeTruthy();

    // Calendar grid and mobile list both render the item; click either button.
    const [itemButton] = screen.getAllByRole("button", {
      name: new RegExp(draftTitle(secondItem.draftId)),
    });
    await user.click(itemButton);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: draftTitle(secondItem.draftId),
      }),
    ).toBeTruthy();
    expect(screen.getByText(secondItem.id)).toBeTruthy();
  });

  it("posts a local comment for the selected draft", async () => {
    const user = userEvent.setup();
    render(<CalendarShell data={mockCalendarPage} />);

    const commentField = screen.getByLabelText<HTMLTextAreaElement>(
      "Add review notes",
    );
    await user.type(commentField, "Tighten the second paragraph.");
    await user.click(screen.getByRole("button", { name: "Post Comment" }));

    expect(
      await screen.findByText("Tighten the second paragraph."),
    ).toBeTruthy();
    expect(commentField.value).toBe("");
  });
});
