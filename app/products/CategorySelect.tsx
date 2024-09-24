import { useState, useEffect } from 'react';
import { Space, Text, Combobox, InputBase, useCombobox } from '@mantine/core';
import { Category } from '@/utils/db';
import { getCategories, addNewCategory } from './actions';

export function CategorySelect({
  category, onChange,
}: { category: Category | null | undefined, onChange: (val:Category | null) => void | undefined }) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [data, setData] = useState<Category[]>([]);
  const [value, setValue] = useState<Category | null>(category === undefined ? null : category);
  const [search, setSearch] = useState(category ? category?.name : '');

  const exactOptionMatch = data.some((item) => item.name === search);
  const filteredOptions = exactOptionMatch
    ? data
    : data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase().trim()));
  const findCategory = (cat:string) => data.find((c) => c.name === cat);

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item.name} key={item.name}>
      {item.name}
    </Combobox.Option>
  ));

  useEffect(() => {
    if (onChange) {
      onChange(value);
    }
  }, [value]);

  useEffect(() => {
    getCategories().then((categories) => {
      // const c = categories.find((cat) => cat.id === category?.id);
      // if (c) {
      //   setValue(c);
      // }
      setData(categories);
    });
  }, []);

  return (
    <Space>
      <Text size="sm" fw={500}>產品類別</Text>
      <Combobox
        store={combobox}
        withinPortal={false}
        shadow="md"
        onOptionSubmit={(val) => {
          if (val === '$create') {
            addNewCategory(search).then((cat) => {
              if (cat && cat.length > 0) {
                setData((current) => [...current, cat[0]]);
                setValue(cat[0]);
              }
            });
          } else {
            const c = findCategory(val);
            if (c) {
              setValue(c);
            }
            setSearch(val);
          }

          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <InputBase
            rightSection={<Combobox.Chevron />}
            value={search}
            onChange={(event) => {
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
              setSearch(event.currentTarget.value);
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => {
              combobox.closeDropdown();
              setSearch(value ? value.name : '');
            }}
            placeholder="搜尋或輸入名稱新增"
            rightSectionPointerEvents="none"
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            {options}
            {!exactOptionMatch && search.trim().length > 0 && (
              <Combobox.Option value="$create">+ 新增 {search}</Combobox.Option>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Space>
  );
}
