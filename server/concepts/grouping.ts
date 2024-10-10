import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GroupDoc extends BaseDoc {
  name: string;
  creator: ObjectId;
  includes: ObjectId[];
}

/**
 * concept: Grouping [User]
 */
export default class GroupingConcept {
  public readonly groups: DocCollection<GroupDoc>;

  /**
   * Make an instance of Grouping.
   */
  constructor(collectionName: string) {
    this.groups = new DocCollection<GroupDoc>(collectionName);
  }

  async create(name: string, creator: ObjectId) {
    this.assertNameUnique(name);
    const _id = await this.groups.createOne({ name, creator });
    return { msg: "Group successfully created!", group: await this.groups.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    await this.groups.deleteOne({ _id });
    return { msg: "Group deleted successfully!" };
  }

  async addToGroup(group: ObjectId, account: ObjectId) {
    const groupDoc = await this.groups.readOne({ _id: group });
    if (groupDoc == null) {
      throw new NotFoundError("Group not found!");
    }

    groupDoc.includes = groupDoc.includes ?? [];

    if (groupDoc.includes.map((a) => a.toString()).includes(account.toString())) {
      throw new NotAllowedError("Account already in group!");
    }

    groupDoc.includes.push(account);

    await this.groups.partialUpdateOne({ _id: group }, { includes: groupDoc.includes });
    return { msg: "Account added to group successfully!" };
  }

  async removeFromGroup(group: ObjectId, account: ObjectId) {
    const groupDoc = await this.groups.readOne({ _id: group });
    if (groupDoc == null) {
      throw new NotFoundError("Group not found!");
    }

    // remove account from group
    const index = groupDoc.includes.map((member) => member.toString()).indexOf(account.toString());
    if (index === -1) {
      throw new NotAllowedError("Account not in group!");
    }

    groupDoc.includes.splice(index, 1);

    await this.groups.partialUpdateOne({ _id: group }, { includes: groupDoc.includes });
    return { msg: "Account removed from group successfully!" };
  }

  async getGroupsByCreator(creator: ObjectId) {
    return await this.groups.readMany({ creator });
  }

  async getGroupsByMember(account: ObjectId) {
    return (await this.groups.readMany({})).filter((group) => group.includes.map((member) => member.toString()).includes(account.toString()));
  }

  async getGroup(_id: ObjectId) {
    const group = await this.groups.readOne({ _id });
    if (!group) {
      throw new NotFoundError("Group does not exist!");
    }

    return group;
  }

  async assertAuthorIsCreator(groupId: ObjectId, creator: ObjectId) {
    const group = await this.groups.readOne({ _id: groupId });
    if (!group) {
      throw new NotFoundError("Group does not exist!");
    }
    if (group.creator.toString() !== creator.toString()) {
      throw new NotAllowedError("User is not group creator!");
    }
  }

  private async assertNameUnique(name: string) {
    if (await this.groups.readOne({ name })) {
      throw new NotAllowedError(`Group with name ${name} already exists!`);
    }
  }
}
