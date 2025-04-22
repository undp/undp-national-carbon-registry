import { AppAbility } from './casl-ability.factory';

interface IPolicyHandler {
  handle(ability: AppAbility, req: any): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility, req: any) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
