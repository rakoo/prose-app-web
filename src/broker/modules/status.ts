/*
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { Availability } from "@prose-im/prose-sdk-js";

// PROJECT: BROKER
import BrokerModule from "@/broker/modules";

/**************************************************************************
 * CLASS
 * ************************************************************************* */

class BrokerModuleStatus extends BrokerModule {
  async setAvailability(availability: Availability): Promise<void> {
    // XMPP: Instant Messaging and Presence
    // https://xmpp.org/rfcs/rfc6121.html#presence

    await this._client.client?.setAvailability(availability);
  }

  async sendActivity(icon?: string, text?: string): Promise<void> {
    // XEP-0108: User Activity
    // https://xmpp.org/extensions/xep-0108.html

    await this._client.client?.sendActivity(icon, text);
  }
}

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export default BrokerModuleStatus;
