import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new McpServer({
  name: "codersgyan",
  version: "1.0.0",
});

server.registerPrompt("greeting-example", {
    title: "Greeting Example",
    description: "A simple greeting prompt template",
    argsSchema: {
        name: z.string().describe("Name to include in greeting"),
    },
}, async ({ name }): Promise<GetPromptResult> => {
    return {
        messages: [{
            role: 'user',
            content: {
                type: "text",
                text: `Please greet ${name} in a friendly manner and say hola everytime`
            }
        }]
    }
});

server.registerPrompt("students-list", {
    title: "Students List",
    description: "A simple template to get students list",
    argsSchema: {
        limit: z.string().describe("Number of students"),
    },
}, async ({ limit }): Promise<GetPromptResult> => {
    return {
        messages: [{
            role: 'user',
            content: {
                type: "text",
                text: `Give me students list, having ${limit} students`
            }
        }]
    }
});

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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Codersgyan MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});