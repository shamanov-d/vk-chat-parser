import {CallbackService, VK} from "vk-io";
import {resolve} from "path";
import {
  DirectAuthorization,
  officialAppCredentials,
} from "@vk-io/authorization";
import readlineSync from "readline-sync";
import {Command} from "commander";
import {Storage} from "./storage";
import {MessagesConversationMember} from "vk-io/lib/api/schemas/objects";
import {writeFileSync} from "fs";

// colors
const Reset = "\x1b[0m",
  FgGreen = "\x1b[32m";

interface Options {
  password?: string;
  login?: string;
}

const cliApp = new Command();
cliApp
  .description("create new release")
  .argument("[chatId]", "vk chat id")
  .option("-p, --password [string]", "password vk page")
  .option("-l, --login [string]", "login vk page")
  .action(async (_, {password, login}: Options, cmd: Command) => {
    let chatId = cmd.args[0];
    if (!chatId) {
      console.log("example id, id marked with color:");
      console.log(`https://vk.com/im?sel=c${FgGreen}209${Reset}`);
      chatId = readlineSync.question("enter chat id:");
    }
    //защита от дурака если кто то скопировал с "с"
    chatId = chatId.replace("c", "");

    let token = Storage.get();
    if (!token) {
      if (!login) login = readlineSync.question("login:");
      if (!password) password = readlineSync.question("password:");

      const callbackService = new CallbackService();
      callbackService.onTwoFactor(async ({phoneMask, type}, retry) => {
        console.log(`send two-factor code type:${type} phone:${phoneMask}`);
        await retry(readlineSync.question("code:"));
      });
      callbackService.onCaptcha(async (data, retry) => {
        console.log(`send captcha`, data);
        await retry(readlineSync.question("captcha code:"));
      });

      const direct = new DirectAuthorization({
        callbackService,
        ...officialAppCredentials.android,
        scope: "all",
        login,
        password,
        apiVersion: "5.154",
      });
      console.log("authorization start...");
      const response = await direct.run();
      token = response.token;
      Storage.save(token);
    }

    const vk = new VK({token, apiVersion: "5.154"});
    const recursiveParse = async (
      peer_id: number,
      cursor = 0,
    ): Promise<MessagesConversationMember[]> => {
      const {count = 0, items = []} =
        await vk.api.messages.getConversationMembers({peer_id, offset: cursor});
      console.log(`record: ${cursor}/${count}|${items.length}`);
      cursor = cursor + items.length;
      if (!count || cursor >= count) return items;
      const nextPage = (await recursiveParse(peer_id, cursor)) || [];
      return [...items, ...nextPage];
    };

    const list = await recursiveParse(2000000000 + Number(chatId));
    const fileData = list.reduce(
      (acc, {member_id}) => acc + member_id + "\n",
      "",
    );

    const path = `${chatId}_base.scv`;
    writeFileSync(resolve(process.cwd() + "/" + path), fileData);
    console.log(`members count: ${list.length}`);
    console.log(`save file ${path}`);
  });
cliApp.parse();
