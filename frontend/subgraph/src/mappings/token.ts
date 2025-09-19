import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Transfer, Approval } from "../../generated/templates/ERC20/ERC20"
import { Token } from "../../generated/schema"
import { ZERO_BI } from "../utils/helpers"

export function handleTransfer(event: Transfer): void {
  // We mainly use this to detect new tokens, actual volume tracking happens in pool events
  let token = Token.load(event.address.toHexString())
  
  if (token !== null) {
    // Update transaction count for the token
    token.txCount = token.txCount.plus(BigInt.fromI32(1))
    token.save()
  }
}

export function handleApproval(event: Approval): void {
  // Track approvals if needed for analytics
  let token = Token.load(event.address.toHexString())
  
  if (token !== null) {
    // Could track approval events here if needed
    // For now, we just ensure the token exists
    token.save()
  }
}