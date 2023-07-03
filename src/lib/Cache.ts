import Group from "../struct/Group.js";

class Cache {
    groups: Group[] = [];

    async getGroup(name: string, instId: string | number ) {
        let group = this.groups.find((g) => g.name == name);

        if (group) return group;
        else {
            let newGroup = new Group(name, +instId);

            await newGroup.init();

            this.groups.push(newGroup);

            return newGroup;
        }
    }
}

export default new Cache();