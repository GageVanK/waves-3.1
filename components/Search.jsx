import { ActionIcon, Modal, Button, TextInput, Space, useMantineTheme, Text } from "@mantine/core";

import { useState } from "react";
import { getSingleProfile } from "deso-protocol";
import { useRouter } from 'next/router';

import { TbUserSearch } from 'react-icons/tb';
import { BiSearchAlt } from 'react-icons/bi';

export const Search = (props) => {
  const router = useRouter();

  const [value, setValue] = useState("");
  const [userNotFound, setuserNotFound] = useState(false);
  
  const theme = useMantineTheme();
  const SearchUser = async () => {
    const request = {
      Username: value,
      NoErrorOnMissing: true,
    };

    const response = await getSingleProfile(request);

    if (response === null) {
      setuserNotFound(true);
      return;
    }

    const state = {
      userPublicKey: response.Profile.PublicKeyBase58Check,
      userName: response.Profile.Username
        ? response.Profile.Username
        : response.Profile.PublicKeyBase58Check,
      description: response.Profile.Description
        ? response.Profile.Description
        : null,
      largeProfPic:
        response.Profile.ExtraData &&
        response.Profile.ExtraData.LargeProfilePicURL
          ? response.Profile.ExtraData.LargeProfilePicURL
          : null,
      featureImage:
        response.Profile.ExtraData &&
        response.Profile.ExtraData.FeaturedImageURL
          ? response.Profile.ExtraData.FeaturedImageURL
          : null,
    };

    setuserNotFound(false)

    router.push(`/wave/${response.Profile.Username}`, undefined, { shallow: true, state });
  };

  return (
    <>
      
        <TextInput
        ml={2}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          radius="md"
      size="md"
          placeholder="Search DeSo Username"
          variant="filled"
          error={userNotFound ? userNotFound : null}
          withAsterisk
        leftSection={<BiSearchAlt size="1rem" />}
          rightSection={
            <ActionIcon onClick={() => {
              SearchUser();
            }} size={32} radius="xl" color={theme.primaryColor} variant="light">
              {theme.dir === 'ltr' ? (
                <TbUserSearch size="1.1rem"  />
              ) : (
                <TbUserSearch size="1.1rem" />
              )}
            </ActionIcon>
          }
          rightSectionWidth={42}
          {...props}
        />

        
   
    </>
  );
};