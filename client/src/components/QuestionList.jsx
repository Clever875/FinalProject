import React, { useState } from 'react';
import { List, Typography, Button, Tooltip, Dropdown, Menu, Tag, message } from 'antd';
import {
  QuestionCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const DraggableRow = ({ id, index, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export default function QuestionList({ questions, editable, onUpdate }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(questions);
  const [visibleIndex, setVisibleIndex] = useState(null);

  const questionTypes = {
    TEXT: t('questionTypes.text'),
    TEXTAREA: t('questionTypes.textarea'),
    NUMBER: t('questionTypes.number'),
    CHECKBOX: t('questionTypes.checkbox'),
    RADIO: t('questionTypes.radio'),
    SELECT: t('questionTypes.select'),
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        if (onUpdate) onUpdate(newItems);
        return newItems;
      });
    }
  };

  const toggleVisibility = (index) => {
    const newItems = [...items];
    newItems[index].displayInTable = !newItems[index].displayInTable;
    setItems(newItems);
    if (onUpdate) onUpdate(newItems);
    message.success(t('question.visibilityUpdated'));
  };

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (onUpdate) onUpdate(newItems);
    message.success(t('question.deleted'));
  };

  const menu = (index) => (
    <Menu>
      <Menu.Item
        key="visibility"
        icon={<CheckCircleOutlined />}
        onClick={() => toggleVisibility(index)}
      >
        {items[index].displayInTable
          ? t('question.hideInTable')
          : t('question.showInTable')}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDelete(index)}
      >
        {t('question.delete')}
      </Menu.Item>
    </Menu>
  );

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(item => item.id)}>
        <List
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(item, index) => (
            <DraggableRow key={item.id} id={item.id} index={index}>
              <List.Item
                actions={editable ? [
                  <Dropdown
                    overlay={menu(index)}
                    trigger={['click']}
                    visible={visibleIndex === index}
                    onVisibleChange={(visible) => setVisibleIndex(visible ? index : null)}
                  >
                    <Button type="text" icon={<MenuOutlined />} />
                  </Dropdown>
                ] : []}
                className="question-list-item"
              >
                <List.Item.Meta
                  avatar={
                    <div className="question-index">
                      <Text strong>{index + 1}</Text>
                    </div>
                  }
                  title={
                    <div className="question-header">
                      <Text strong>{item.title}</Text>
                      {item.isRequired && (
                        <Text type="danger" className="required-star">*</Text>
                      )}
                      <Tag color="blue" className="question-type-tag">
                        {questionTypes[item.type]}
                      </Tag>
                      {item.displayInTable && (
                        <Tooltip title={t('question.visibleInTable')}>
                          <CheckCircleOutlined className="visibility-icon" />
                        </Tooltip>
                      )}
                    </div>
                  }
                  description={
                    item.description && (
                      <Text type="secondary">{item.description}</Text>
                    )
                  }
                />
              </List.Item>
            </DraggableRow>
          )}
        />
      </SortableContext>
    </DndContext>
  );
}
