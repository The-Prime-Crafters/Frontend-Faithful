import React from 'react';
import { Button, Modal, Text, View } from 'react-native';

interface ViewMoreModalProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

const ViewMoreModal: React.FC<ViewMoreModalProps> = ({ visible, title, content, onClose }) => (
  <Modal visible={visible} transparent>
    <View>
      <Text>{title}</Text>
      <Text>{content}</Text>
      <Button title="Close" onPress={onClose} />
    </View>
  </Modal>
);

export default ViewMoreModal;
