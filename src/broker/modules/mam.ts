/*
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { $iq } from "strophe.js";
import xmppID from "@xmpp/id";
import { JID } from "@xmpp/jid";

// PROJECT: BROKER
import BrokerModule from "@/broker/modules";
import { IQType } from "@/broker/stanzas/iq";
import { MessageID } from "@/broker/stanzas/message";
import { NS_MAM, NS_RSM, NS_DATA } from "@/broker/stanzas/xmlns";

// PROJECT: UTILITIES
import logger from "@/utilities/logger";

/**************************************************************************
 * CONSTANTS
 * ************************************************************************* */

const HISTORY_PAGE_SIZE = 40;

/**************************************************************************
 * CLASS
 * ************************************************************************* */

class BrokerModuleMAM extends BrokerModule {
  async loadMessages(jid: JID, beforeId?: MessageID): Promise<Element> {
    // XEP-0313: Message Archive Management
    // https://xmpp.org/extensions/xep-0313.html
    const stanza = $iq({ type: IQType.Set, id: xmppID() });

    // Append query
    {
      const stanzaQuery = stanza.c("query", { xmlns: NS_MAM });

      // Append filters to query (<x> element)
      {
        const stanzaQueryData = stanzaQuery.c("x", {
          xmlns: NS_DATA,
          type: "submit"
        });

        stanzaQueryData
          .c("field", { var: "FORM_TYPE", type: "hidden" })
          .c("value", {}, NS_MAM)
          .up();

        stanzaQueryData
          .c("field", { var: "with" })
          .c("value", {}, jid.toString())
          .up();

        if (beforeId) {
          stanzaQueryData
            .c("field", { var: "before-id" })
            .c("value", {}, beforeId)
            .up();
        }

        // Done, go back to root
        stanzaQueryData.up();
      }

      // Append RSM to query (Result Set Management — <set> element)
      {
        stanzaQuery
          .c("set", { xmlns: NS_RSM })
          .c("max", {}, HISTORY_PAGE_SIZE.toString())
          .c("before", {}, ""); // TODO: collides w/ before-id?

        // Done, go back to root
        stanzaQuery.up();
      }
    }

    logger.info(
      `Will load messages from history from: '${jid}' before #${
        beforeId || "--"
      }`
    );

    return this._client.request(stanza);
  }
}

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export default BrokerModuleMAM;
