import { Client, Collection, ChatInputCommandInteraction, SlashCommandBuilder, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from 'discord.js';
import type { Interaction } from 'discord.js';
import { CUSTOM_IDS } from '../constants/project.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction: Interaction): Promise<void> {
    const client = interaction.client as Client;

  try {
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction, client);
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalInteraction(interaction);
    }
  } catch (error) {
    console.error('Unexpected interaction handling error:', error);
  }
}

async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const { commands } = client;

  if (!commands?.has(interaction.commandName)) {
    console.warn(`Unknown command: ${interaction.commandName}`);
    return sendErrorResponse(
      interaction,
      `Command \`${interaction.commandName}\` not found.`,
      `Unknown command: ${interaction.commandName}`,
      'command_not_found',
    );
  }

  const command = commands.get(interaction.commandName)!;

  try {
    // Enhanced logging for user install context
    const context = interaction.guild ? 'guild' : 'user install';
    const authOwners = (interaction as any).authorizingIntegrationOwners;
    
    console.log(`Running /${interaction.commandName} by ${interaction.user.tag} (context: ${context})`);
    
    if (authOwners) {
      console.log(`Authorization context: ${JSON.stringify(authOwners)}`);
    }
    
    const start = Date.now();
    await command.execute(interaction);
    const ms = Date.now() - start;
    console.log(`${interaction.commandName} executed in ${ms}ms`);
  } catch (err) {
    console.error(`Error in command ${interaction.commandName}:`, err);
    await sendErrorResponse(
      interaction,
      'Something went wrong while executing the command.',
      err instanceof Error ? err : new Error(String(err)),
      'command_execution_error'
    );
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  console.log(`Button: ${interaction.customId} by ${interaction.user.tag}`);
  const client = interaction.client as Client;

  try {
    // Check if it's a newproject button
    if (interaction.customId.startsWith(`${CUSTOM_IDS.NEW_PROJECT_BUTTON}_`)) {
      const { execute } = await import('../interactions/buttons/newProjectButton.js');
      await execute(interaction);
      return;
    }

    // Handle other button interactions
    const button = client.buttons?.get(interaction.customId);
    if (button) {
      await button.execute(interaction);
    } else {
      switch (interaction.customId) {
        case 'ping_refresh':
          break;
        default:
          console.info(`Unhandled button: ${interaction.customId}`);
      }
    }
  } catch (err) {
    console.error(`Button error (${interaction.customId}):`, err);
  }
}

async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction): Promise<void> {
  console.log(`Select Menu: ${interaction.customId} by ${interaction.user.tag}`);

  try {
    switch (interaction.customId) {
      default:
        console.info(`Unhandled select menu: ${interaction.customId}`);
    }
  } catch (err) {
    console.error(`Select menu error (${interaction.customId}):`, err);
  }
}

async function handleModalInteraction(interaction: ModalSubmitInteraction): Promise<void> {
  console.log(`Modal: ${interaction.customId} by ${interaction.user.tag}`);

  try {
    // Check if it's a newproject modal
    if (interaction.customId.startsWith(`${CUSTOM_IDS.NEW_PROJECT_MODAL}_`)) {
      const { execute } = await import('../interactions/modals/newProjectModal.js');
      await execute(interaction);
      return;
    }

    // Handle other modal interactions
    const client = interaction.client as Client;
    const modal = client.modals?.get(interaction.customId);
    if (modal) {
      await modal.execute(interaction);
    } else {
      switch (interaction.customId) {
        default:
          console.info(`Unhandled modal: ${interaction.customId}`);
      }
    }
  } catch (err) {
    console.error(`Modal error (${interaction.customId}):`, err);
  }
}

async function sendErrorResponse(
  interaction: ChatInputCommandInteraction,
  userMessage: string,
  error: string | Error,
  errorType: string,
): Promise<void> {
  const message = { content: userMessage, ephemeral: true };

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message);
    } else {
      await interaction.reply(message);
    }
  } catch (replyErr) {
    console.error('Failed to reply with error:', replyErr);
  }
}