'use client';

import {
  ActionIcon,
  Group,
  Select,
  NumberInput,
  Stack,
  Text,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { SpecialOffer } from '@/utils/db';

enum SpecialOfferType {
  GIFT = 'GIFT',
  UNIT_PRICE = 'UNIT_PRICE',
}

export function SpecialOfferCard({ offer, onChange, onRemove }
  : {
      offer:SpecialOffer,
      onChange: (offer:SpecialOffer) => void
      onRemove: () => void
    }
) {
  const [specialOfferMatch, setSpecialOfferMatch] = useState<number>();
  const [specialOfferType, setSpecialOfferType] = useState<SpecialOfferType | null>(null);
  const [specialOffer, setSpecialOffer] = useState<SpecialOffer>(offer);

  useEffect(() => {
    if (onChange) {
      onChange(specialOffer);
    }
  }, [specialOffer]);

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Text size="sm">每</Text>
          <NumberInput
            value={specialOfferMatch}
            onChange={(value) => {
              setSpecialOfferMatch(Number(value));
              setSpecialOffer({
                ...specialOffer,
                match: {
                  quantity: Number(value),
                },
              });
            }}
          />
          <Text size="sm">組</Text>
        </Group>
        <ActionIcon
          variant="transparent"
          aria-label="Remove"
          color="black"
          onClick={() => { if (onRemove) onRemove(); }}
        >
          <IconTrash style={{ width: '80%', height: '80%' }} stroke={1} />
        </ActionIcon>
      </Group>
      <Group>
        <Text size="sm">提供優惠</Text>
        <Select
          data={[{ value: SpecialOfferType.GIFT, label: '加贈' }, { value: SpecialOfferType.UNIT_PRICE, label: '優惠單位價' }]}
          value={specialOfferType}
          clearable
          onChange={(value) => {
            if (value) {
              if (value === SpecialOfferType.GIFT) {
                setSpecialOfferType(SpecialOfferType.GIFT);
              } else {
                setSpecialOfferType(SpecialOfferType.UNIT_PRICE);
              }
            } else {
              setSpecialOfferType(null);
            }
          }}
        />
        <NumberInput
          onChange={(value) => {
            if (specialOfferType === SpecialOfferType.GIFT) {
              setSpecialOffer({
                ...specialOffer,
                offer: {
                  gift: Number(value),
                },
              });
            } else {
              setSpecialOffer({
                ...specialOffer,
                offer: {
                  unit_price: Number(value),
                },
              });
            }
          }}
        />
        <Text>{specialOfferType === SpecialOfferType.GIFT ? '組' : specialOfferType === SpecialOfferType.UNIT_PRICE ? '元' : ''}</Text>
      </Group>
    </Stack>
  );
}
