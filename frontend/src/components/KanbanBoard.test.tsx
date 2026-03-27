import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";

const getColumns = () => screen.getAllByTestId(/^column-col-/i);
const getFirstColumn = () => getColumns()[0];

describe("KanbanBoard", () => {
  it("renders five columns", () => {
    render(<KanbanBoard />);
    expect(getColumns()).toHaveLength(5);
  });

  it("adds a new column with the expected controls", async () => {
    render(<KanbanBoard />);

    await userEvent.click(
      screen.getByRole("button", { name: /add column/i })
    );

    const columns = getColumns();
    expect(columns).toHaveLength(6);

    const newColumn = columns[5];
    expect(within(newColumn).getByLabelText("Column title")).toHaveValue(
      "New Column 6"
    );
    expect(within(newColumn).getByText(/drop a card here/i)).toBeInTheDocument();
    expect(
      within(newColumn).getByRole("button", { name: /add a card/i })
    ).toBeInTheDocument();
  });

  it("renames a column", async () => {
    render(<KanbanBoard />);
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("deletes a column and removes its cards", async () => {
    render(<KanbanBoard />);
    const firstColumn = getFirstColumn();

    expect(getColumns()).toHaveLength(5);
    expect(screen.getByText("Align roadmap themes")).toBeInTheDocument();

    await userEvent.click(
      within(firstColumn).getByRole("button", {
        name: /delete column backlog/i,
      })
    );

    expect(getColumns()).toHaveLength(4);
    expect(screen.queryByText("Align roadmap themes")).not.toBeInTheDocument();
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });

  it("keeps dashboard column pills and board titles in sync", async () => {
    render(<KanbanBoard />);

    const columnTitle = within(getFirstColumn()).getByLabelText("Column title");
    const pillTitle = screen.getByTestId("dashboard-column-pill-input-col-backlog");

    await userEvent.clear(pillTitle);
    await userEvent.type(pillTitle, "Ideas");
    expect(columnTitle).toHaveValue("Ideas");

    await userEvent.clear(columnTitle);
    await userEvent.type(columnTitle, "Research");
    expect(pillTitle).toHaveValue("Research");
  });

  it("reverts unsaved rename changes on outside click", async () => {
    render(<KanbanBoard />);

    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");

    await userEvent.clear(input);
    await userEvent.type(input, "Temporary");
    expect(input).toHaveValue("Temporary");

    await userEvent.click(screen.getByTestId("board-add-column"));

    expect(input).toHaveValue("Backlog");
    expect(screen.getByTestId("dashboard-column-pill-input-col-backlog")).toHaveValue(
      "Backlog"
    );
  });
});
