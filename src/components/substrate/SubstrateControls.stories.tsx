import type { Meta, StoryObj } from "@storybook/react-vite";
import { SubstrateControls } from "./SubstrateControls";

const meta = {
  title: "Substrate/SubstrateControls",
  component: SubstrateControls,
  decorators: [
    (Story) => (
      <div className="relative h-[800px] w-full overflow-hidden bg-[#f8f6f0] p-8">
        {/* Background placeholder to simulate the canvas */}
        <div className="absolute inset-0 flex items-center justify-center text-zinc-200 select-none">
          <div className="text-9xl font-bold opacity-10">SUBSTRATE</div>
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SubstrateControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    initialOpen: false,
  },
};

export const Opened: Story = {
  args: {
    initialOpen: true,
  },
};

export const LargeScreen: Story = {
  args: {
    initialOpen: true,
  },
  decorators: [
    (Story) => (
      <div className="relative h-[1080px] w-full overflow-hidden bg-[#f8f6f0] p-8">
        <Story />
      </div>
    ),
  ],
};
