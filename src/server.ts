import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GetPromptResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const server = new McpServer({
  name: "codersgyan",
  version: "1.0.0",
});

const PORT = 8787;

server.registerPrompt(
  "greeting-example",
  {
    title: "Greeting Example",
    description: "A simple greeting prompt template",
    argsSchema: {
      name: z.string().describe("Name to include in greeting"),
    },
  },
  async ({ name }): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please greet ${name} in a friendly manner and say hola everytime`,
          },
        },
      ],
    };
  },
);

server.registerPrompt(
  "students-list",
  {
    title: "Students List",
    description: "A simple template to get students list",
    argsSchema: {
      limit: z.string().describe("Number of students"),
    },
  },
  async ({ limit }): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Give me students list, having ${limit} students`,
          },
        },
      ],
    };
  },
);

server.registerTool(
  "get_all_students",
  {
    description: "Get list of all students with their enrollment information",
    inputSchema: {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of student to return"),
    },
  },
  async ({ limit }) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const lastWeek = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split("T")[0];
    const lastMonth = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .split("T")[0];

    const students = [
      {
        id: "STU001",
        name: "Rahul Sharma",
        email: "rahul.sharma@gmail.com",
        joinedAt: lastMonth,
      },
      {
        id: "STU002",
        name: "Priya Patel",
        email: "priya.patel@gmail.com",
        joinedAt: lastMonth,
      },
      {
        id: "STU003",
        name: "Amit Kumar",
        email: "amit.kumar@gmail.com",
        joinedAt: lastWeek,
      },
      {
        id: "STU004",
        name: "Sneha Gupta",
        email: "sneha.gupta@gmail.com",
        joinedAt: lastWeek,
      },
      {
        id: "STU005",
        name: "Vikram Singh",
        email: "vikram.singh@gmail.com",
        joinedAt: yesterday,
      },
      {
        id: "STU006",
        name: "Anjali Verma",
        email: "anjali.verma@gmail.com",
        joinedAt: yesterday,
      },
      {
        id: "STU007",
        name: "Rohan Desai",
        email: "rohan.desai@gmail.com",
        joinedAt: today,
      },
      {
        id: "STU008",
        name: "Kavita Reddy",
        email: "kavita.reddy@gmail.com",
        joinedAt: today,
      },
      {
        id: "STU009",
        name: "Arjun Nair",
        email: "arjun.nair@gmail.com",
        joinedAt: today,
      },
      {
        id: "STU010",
        name: "Meera Joshi",
        email: "meera.joshi@gmail.com",
        joinedAt: lastWeek,
      },
      {
        id: "STU011",
        name: "Sanjay Mishra",
        email: "sanjay.mishra@gmail.com",
        joinedAt: lastMonth,
      },
      {
        id: "STU012",
        name: "Divya Saxena",
        email: "divya.saxena@gmail.com",
        joinedAt: today,
      },
    ];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(students.slice(0, limit)),
        },
      ],
    };
  },
);

server.registerResource(
  "refund-policy",
  "https://codersgyan.com/refund-policy",
  {
    title: "Codersgyan Refund Policy",
    description: "This is codersgyan refund policy",
    mimeType: "text/plain",
  },
  async (): Promise<ReadResourceResult> => {
    return {
      contents: [
        {
          uri: "https://codersgyan.com/refund-policy",
          text: `At Coder's Gyan, we are committed to providing high-quality, valuable programming courses and materials to our learners. To ensure your complete satisfaction and confidence in your purchase, we now offer a 100% risk-free, 23-day money-back guarantee. Your satisfaction is our priority.
1. 23 Day Money-Back Guarantee

We believe in the value of our courses, and we want you to feel confident in your decision. If you’re not satisfied with your purchase for any reason, you can request a full refund within 23 days of your purchase — no risk, no questions asked.
2. How to Request a Refund

To initiate a refund request within the 23-day window, simply contact us at hello@codersgyan.com with your order details, and our team will process your refund promptly.
3. Important Notes:

Some importent points related to our Refund Policy:

✔󠀿 Request Period: Refunds are only available within 23 days from the original purchase date.

✔󠀿 No Late Refunds: Refund requests will not be accepted after 23 days.

✔󠀿 One-Time Refund: Each course is eligible for a one-time refund per user only to prevent misuse.

✔󠀿 Content Usage Limit: Refunds are not applicable if a significant portion of the course has already been consumed. To maintain fairness, users who have watched more than 3 hours of content or have downloaded a notable amount of course material will not be eligible for a refund during the 23-day window.
4. Commitment to Quality

We want you to be confident in what you’re buying. That’s why we offer:

✔󠀿 Detailed Course Descriptions: Each course page outlines what you’ll learn, what’s included, and the skills you'll gain by the end of the course.

✔󠀿 Module Breakdown: We show the structure of our courses, including the lessons and topics covered in each section, so you know exactly what to expect.

✔󠀿 Preview Content: Access sample videos or introductory lessons for free, so you can evaluate our teaching style before making a purchase.

✔󠀿 Free Modules (when available): Some courses include complete modules available at no cost, giving you hands-on exposure to the learning experience.
5. Contact us

If you have any questions regarding our courses or need further information before purchasing, please feel free to contact us at hello@codersgyan.com`,
        },
      ],
    };
  },
);

function main() {
  const app = new Hono();
  const transport = new StreamableHTTPTransport();

  app.all("/mcp", async (context) => {
    try {
      console.log(await context.req.json());
    } catch (e) {}

    if (!server.isConnected()) {
      await server.connect(transport);
    }

    return transport.handleRequest(context);
  });

  serve({
    fetch: app.fetch,
    port: PORT,
  });

  console.log("Connected to server on Port: ", PORT);
}

main();
