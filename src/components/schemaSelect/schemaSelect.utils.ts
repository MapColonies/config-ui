import { schemaTree, schemaTreeDir, schemaTreeItem } from '../../api/client';

export type GroupOption = {
  title: string;
  id: string;
  group: string;
};

export const flattenData = (data: schemaTree, parentName: string = ''): GroupOption[] => {
  let options: GroupOption[] = [];
  data.forEach((item) => {
    if (isSchemaTreeDir(item)) {
      const groupName = parentName ? `${parentName}/${item.name}` : item.name ?? '';
      if (item.children) {
        options = options.concat(flattenData(item.children, groupName));
      }
    } else if (isSchemaTreeItem(item)) {
      if (item.name != null && item.id != null) {
        options.push({
          title: item.name,
          id: item.id,
          group: parentName,
        });
      }
    }
  });
  return options;
};

// Type guards to check if an object is a schemaTreeDir or schemaTreeItem
function isSchemaTreeDir(item: schemaTreeDir | schemaTreeItem): item is schemaTreeDir {
  return typeof item === 'object' && 'children' in item;
}

function isSchemaTreeItem(item: schemaTreeDir | schemaTreeItem): item is schemaTreeItem {
  return typeof item === 'object' && 'id' in item;
}
