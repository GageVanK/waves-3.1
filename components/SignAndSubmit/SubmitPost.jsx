import { updateProfile, identity, submitPost, getSingleProfile, uploadImage } from 'deso-protocol';
import React, { useContext, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { RiImageAddFill } from 'react-icons/ri';
import { TbVideoPlus } from 'react-icons/tb';
import {
  Input,
  Button,
  Center,
  Space,
  Divider,
  Text,
  Textarea,
  Group,
  Loader,
  Avatar,
  Container,
  Tooltip,
  Badge,
  TextInput,
  FileButton,
  ActionIcon,
  Image,
  Collapse,
  useMantineTheme,
  Notification,
  List,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { GiWaveCrest } from 'react-icons/gi';
import { DeSoIdentityContext } from 'react-deso-protocol';
import { Player, useAssetMetrics, useCreateAsset } from '@livepeer/react';
import { ImEmbed } from 'react-icons/im';
import { IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { FaPoll } from 'react-icons/fa';
import { TiInfoLargeOutline } from 'react-icons/ti';
import { MdAddChart, MdDeleteForever } from 'react-icons/md';
import { CgPlayListAdd } from 'react-icons/cg';
import {
  getEmbedHeight,
  getEmbedURL,
  getEmbedWidth,
  isValidEmbedURL,
} from '../../helpers/EmbedUrls';

export const SignAndSubmitTx = ({ close }) => {
  const { currentUser, isLoading } = useContext(DeSoIdentityContext);
  const [newUsername, setNewUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [opened, { toggle }] = useDisclosure(false);
  const resetImageRef = useRef(null);
  const resetVideoRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [bodyText, setBodyText] = useState('');
  const [poll, setPoll] = useState(false);
  const [embed, setEmbed] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  const handlePollOptions = (index, value) => {
    // Create a new array with the same values, but with the updated value at the specified index
    const newOptions = [...pollOptions];
    newOptions[index] = value;

    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']); // Add a new empty option
  };

  const deletePollOption = (index) => {
    const newOptions = pollOptions.filter((_, idx) => idx !== index);
    setPollOptions(newOptions);
  };

  const pollToggle = () => {
    if (poll) {
      setPoll(false);
    } else {
      setPoll(true);
    }
  };

  const embedToggle = () => {
    if (embed) {
      setEmbed(false);
    } else {
      setEmbed(true);
    }
  };

  const handleEmbedLink = (e) => {
    const link = e.target.value;

    if (link.trim().length > 0) {
      const response = getEmbedURL(link);
      const isValid = isValidEmbedURL(response);
      if (isValid) {
        setEmbedUrl(response);
      } else {
        setEmbedUrl(null);
      }
    }
  };

  const {
    mutate: createAsset,
    data: asset,
    status,
    progress,
    error,
  } = useCreateAsset(
    video
      ? {
          sources: [{ name: video.name, file: video }],
        }
      : null
  );

  const { data: metrics } = useAssetMetrics({
    assetId: asset?.[0].id,
    refetchInterval: 30000,
  });

  const isVideoLoading = useMemo(
    () => status === 'loading' || (asset?.[0] && asset[0].status?.phase !== 'ready'),
    [status, asset]
  );

  const progressFormatted = useMemo(
    () =>
      progress?.[0].phase === 'failed'
        ? 'Failed to process video.'
        : progress?.[0].phase === 'waiting'
        ? 'Waiting...'
        : progress?.[0].phase === 'uploading'
        ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
        : progress?.[0].phase === 'processing'
        ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
        : null,
    [progress]
  );

  const [uploadInitiated, setUploadInitiated] = useState(false);
  const handleUploadImage = async () => {
    if (uploadInitiated) {
      return; // Exit if upload has already been initiated
    }
    setUploadInitiated(true);

    try {
      setImageLoading(true);
      const response = await uploadImage({
        UserPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        file: imageFile,
      });

      setImageURL(response.ImageURL);
      setImageLoading(false);
      notifications.show({
        title: 'Success',
        icon: <IconCheck size="1.1rem" />,
        color: 'green',
        message: 'Uploaded!',
      });
    } catch (error) {
      setImageLoading(false);
      notifications.show({
        title: 'Error',
        icon: <IconX size="1.1rem" />,
        color: 'red',
        message: 'Something Happened!',
      });
      console.log(`Something happened: ${error}`);
    } finally {
      setUploadInitiated(false);
    }
  };

  useEffect(() => {
    if (imageFile) {
      handleUploadImage(); // Automatically trigger upload when imageFile is set
    }
  }, [imageFile]); // This effect runs whenever imageFile changes

  useEffect(() => {
    if (video) {
      createAsset(); // Call createAsset function when videoFile is set
    }
  }, [video]);

  const handleUpdateUsername = async () => {
    try {
      await updateProfile({
        UpdaterPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        ProfilePublicKeyBase58Check: '',
        NewUsername: newUsername,
        MinFeeRateNanosPerKB: 1000,
        NewCreatorBasisPoints: 100,
        NewDescription: '',
        NewStakeMultipleBasisPoints: 12500,
      });
    } catch (error) {
      console.log(`something happened: ${error}`);
    }

    window.location.reload();
  };

  const handleCreatePost = async () => {
    try {
      setIsLoadingPost(true);
      // check if the user can make a post
      if (
        !identity.hasPermissions({
          TransactionCountLimitMap: {
            SUBMIT_POST: 1,
          },
        })
      ) {
        // if the user doesn't have permissions, request them
        // and abort the submit
        identity.requestPermissions({
          GlobalDESOLimit: 10000000, // 0.01 DESO
          TransactionCountLimitMap: {
            SUBMIT_POST: 3,
          },
        });
        return;
      }

      // Filter out empty or whitespace-only options
      const validPollOptions = pollOptions.filter((option) => option.trim() !== '');

      const resp = await submitPost({
        UpdaterPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        BodyObj: {
          Body: bodyText,
          ImageURLs: imageURL ? [imageURL] : [],
          VideoURLs:
            asset && asset[0]?.playbackId ? [`https://lvpr.tv/?v=${asset[0].playbackId}`] : [],
        },
        PostExtraData: {
          EmbedVideoURL: embedUrl || '',
          PollOptions: validPollOptions.length >= 2 ? JSON.stringify(validPollOptions) : null,
          PollWeightType: validPollOptions.length >= 2 ? 'unweighted' : null,
        },
      });

      setIsLoadingPost(false);

      notifications.show({
        title: 'Success',
        icon: <IconCheck size="1.1rem" />,
        color: 'green',
        message: 'Post was successfully submitted!',
      });

      setBodyText('');
      if (imageURL) {
        setImageURL('');
        setImageFile(null);
        resetImageRef.current?.();
      }
      if (embedUrl) {
        setEmbedUrl('');
      }
      if (video) {
        setVideo(null);
        resetVideoRef.current?.();
      }

      if (pollOptions && pollOptions.length > 1) {
        setPollOptions(['', '']);
        setPoll(false);
      }

      if (typeof close === 'function') {
        close();
      }
    } catch (err) {
      console.log(`something happened: ${err}`);
    }
  };

  if (isLoading) {
    return (
      <Center>
        <Loader variant="bars" />
      </Center>
    );
  }

  if (!currentUser || !currentUser.BalanceNanos) {
    return (
      <>
        <Center>
          <Text
            fz={66}
            fw={900}
            fs="italic"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 176 }}
          >
            Waves
          </Text>
        </Center>
        <Container size={560} p={0}>
          <Center>
            <Text fw={700} size="md">
              Twitch Meets Twitter
            </Text>
          </Center>

          <Space h="xl" />
          <Button
            gradient={{ from: 'blue', to: 'cyan', deg: 354 }}
            fullWidth
            leftSection={<GiWaveCrest size="1rem" />}
            variant="gradient"
            radius="lg"
            onClick={() => identity.login()}
          >
            Sign Up
          </Button>
        </Container>
        <Space h="md" />

        <Group>
          <Avatar size="md" radius="xl" alt="Profile Picture" />
          <Text fz="lg" fw={777} variant="gradient" truncate="end" />
        </Group>
        <Space h="sm" />
        <Textarea
          disabled
          name="body"
          radius="md"
          autosize
          placeholder="Sign In or Sign Up to Create!"
          variant="filled"
          size="md"
        />
        <Space h="sm" />
        <Group postion="apart">
          <Tooltip label="Sign In or Sign Up to Create!">
            <Button
              raduis="sm"
              data-disabled
              sx={{ '&[data-disabled]': { pointerEvents: 'all' } }}
              onClick={(event) => event.preventDefault()}
            >
              Create
            </Button>
          </Tooltip>
        </Group>
      </>
    );
  }
  if (currentUser.ProfileEntryResponse === null) {
    return (
      <>
        <Center>
          <Badge
            size="md"
            radius="sm"
            variant="gradient"
            gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}
          >
            Enter Username
          </Badge>

          <Space h="xs" />
        </Center>
        <Group justify="center" grow>
          <TextInput
            type="text"
            label="Username"
            value={newUsername}
            placeholder="New username"
            onChange={async (e) => {
              setNewUsername(e.target.value);
              e.preventDefault();

              const regex = /^[a-zA-Z0-9_]*$/;
              if (!regex.test(e.target.value)) {
                setErrorMessage('Username cannot contain special characters');
                setIsButtonDisabled(true);
              } else {
                setErrorMessage('');

                try {
                  const request = {
                    PublicKeyBase58Check: '',
                    Username: e.target.value,
                    NoErrorOnMissing: true,
                  };

                  try {
                    const userFound = await getSingleProfile(request);

                    if (userFound === null) {
                      setErrorMessage('');
                      setIsButtonDisabled(false);
                    } else {
                      setErrorMessage('Username is not available');
                      setIsButtonDisabled(true);
                    }
                  } catch (error) {
                    setIsButtonDisabled(true);
                    setErrorMessage('');
                  }
                } catch (error) {
                  console.log(error);
                }
              }
            }}
            error={errorMessage}
          />
        </Group>

        <Space h="sm" />

        <Group justify="right">
          <Button disabled={isButtonDisabled} onClick={handleUpdateUsername}>
            Update
          </Button>
        </Group>
      </>
    );
  }
  return (
    <>
      <Group>
        <Avatar
          size="lg"
          radius="md"
          src={`https://node.deso.org/api/v0/get-single-profile-picture/${currentUser?.PublicKeyBase58Check}`}
          alt="Profile Picture"
        />
        <Text fz="lg" fw={500} truncate="end">
          {currentUser.ProfileEntryResponse?.ExtraData?.DisplayName ||
            currentUser.ProfileEntryResponse?.Username ||
            currentUser.PublicKeyBase58Check}
        </Text>
      </Group>
      <Space h="sm" />
      <Textarea
        name="body"
        radius="md"
        placeholder="Announce your next Wave!"
        autosize
        variant="filled"
        size="md"
        value={bodyText}
        onChange={(event) => setBodyText(event.currentTarget.value)}
      />
      <Space h="sm" />
      {imageURL && (
        <div>
          <ActionIcon
            type="button"
            onClick={() => {
              setImageURL('');
              setImageFile(null);
              resetImageRef.current?.();
            }}
            size="xs"
            color="red"
          >
            <IconX />
          </ActionIcon>
          <Image src={imageURL} alt="Uploaded" maw={240} mx="auto" radius="md" />
        </div>
      )}

      {error?.message && (
        <>
          <Notification
            withCloseButton={false}
            withBorder
            icon={<IconX size="1.1rem" />}
            color="red"
          >
            Trouble Uploading Video! {error.message}
          </Notification>
        </>
      )}

      {video && asset?.[0]?.playbackId && (
        <>
          <div>
            <ActionIcon
              type="button"
              onClick={() => {
                setVideo(null);

                resetVideoRef.current?.();
              }}
              size="xs"
              color="red"
            >
              <IconX />
            </ActionIcon>
          </div>
          <Player
            priority
            controls={{ autohide: 0, hotkeys: false, defaultVolume: 0.6 }}
            showPipButton
            theme={{
              colors: {
                loading: '#3cdfff',
              },
            }}
            title={asset[0].name}
            playbackId={asset[0].playbackId}
          />
          <Space h="xs" />
        </>
      )}

      {progressFormatted && (
        <>
          <Text fz="sm" c="dimmed">
            {progressFormatted}
          </Text>

          <Space h="xs" />
        </>
      )}

      {embedUrl && (
        <>
          <div>
            <ActionIcon type="button" onClick={() => setEmbedUrl('')} size="xs" color="red">
              <IconX />
            </ActionIcon>
          </div>

          <iframe
            title="extraembed-video"
            id="embed-iframe"
            className="w-full flex-shrink-0 feed-post__image"
            height={getEmbedHeight(embedUrl)}
            style={{ maxWidth: getEmbedWidth(embedUrl) }}
            src={embedUrl}
            frameBorder="0"
            allow="picture-in-picture; clipboard-write; encrypted-media; gyroscope; accelerometer; encrypted-media;"
            allowFullScreen
          />

          <Space h="xs" />
        </>
      )}

      {embed && (
        <>
          <Space h="xs" />
          <Box w={222}>
            <TextInput
              leftSection={
                <>
                  <Tooltip
                    label={
                      <>
                        <Group justify="center">Supported</Group>

                        <Divider />

                        <List size="xs">
                          <List.Item>Twitch</List.Item>
                          <List.Item>Youtube</List.Item>
                          <List.Item>Spotify</List.Item>
                          <List.Item>Vimeo</List.Item>
                          <List.Item>Giphy</List.Item>
                          <List.Item>SoundCloud</List.Item>
                          <List.Item>Mousai</List.Item>
                          <List.Item>Request more in Global Chat!</List.Item>
                        </List>
                      </>
                    }
                    position="bottom"
                    withArrow
                  >
                    <ActionIcon type="button" size="xs" radius="xl" variant="default">
                      <TiInfoLargeOutline />
                    </ActionIcon>
                  </Tooltip>
                </>
              }
              rightSection={
                embedUrl && (
                  <ActionIcon
                    type="button"
                    onClick={() => setEmbedUrl('')}
                    color="red"
                    size="xs"
                    radius="xl"
                    variant="subtle"
                  >
                    <IconX />
                  </ActionIcon>
                )
              }
              value={embedUrl}
              onChange={handleEmbedLink}
              variant="filled"
              size="xs"
              radius="xl"
              placeholder="Add Link"
            />
          </Box>
          <Space h="xs" />
        </>
      )}

      {poll && (
        <>
          <Space h="xs" />

          <Container size="sm">
            <Group justify="right">
              <Tooltip label="Add Options">
                <ActionIcon type="button" onClick={addPollOption} size="sm">
                  <CgPlayListAdd size="1.1rem" />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Space h="md" />

            {pollOptions &&
              pollOptions?.map((option, index) => (
                <div key={index}>
                  <TextInput
                    variant="filled"
                    placeholder={`Option ${index + 1}`}
                    radius="xl"
                    value={option}
                    onChange={(event) => handlePollOptions(index, event.currentTarget.value)}
                    rightSection={
                      index > 1 && (
                        <ActionIcon
                          radius="xl"
                          size="sm"
                          color="red"
                          variant="light"
                          type="button"
                          onClick={() => deletePollOption(index)}
                        >
                          <MdDeleteForever />
                        </ActionIcon>
                      )
                    }
                  />

                  <Space h="sm" />
                </div>
              ))}
          </Container>
          <Space h="xs" />
        </>
      )}

      <Space h="sm" />
      <Group postion="apart">
        <Space h="sm" />
        <Button
          variant="gradient"
          gradient={{ from: 'cyan', to: 'indigo' }}
          raduis="sm"
          onClick={handleCreatePost}
          disabled={
            !bodyText.trim() ||
            isLoadingPost ||
            (poll && pollOptions.filter((option) => option.trim() !== '').length < 2)
          }
          loading={isLoadingPost}
        >
          Create
        </Button>

        <FileButton
          onChange={setImageFile}
          accept="image/png,image/jpeg,image/png,image.gif,image/webp"
          resetRef={resetImageRef}
          type="button"
        >
          {(props) => (
            <Tooltip label="Upload Image">
              <ActionIcon
                color="blue"
                size="lg"
                variant="default"
                {...props}
                loading={imageLoading}
              >
                <RiImageAddFill size="1.2rem" />
              </ActionIcon>
            </Tooltip>
          )}
        </FileButton>

        <FileButton
          resetRef={resetVideoRef}
          onChange={setVideo}
          accept="video/mp4,video/mov,video/mpeg,video/flv,video/mwv,video/m3u8"
          type="button"
        >
          {(props) => (
            <Tooltip label="Upload Video">
              <ActionIcon
                color="blue"
                size="lg"
                variant="default"
                {...props}
                loading={isVideoLoading}
              >
                <TbVideoPlus size="1.2rem" />
              </ActionIcon>
            </Tooltip>
          )}
        </FileButton>

        <Tooltip label="Add Poll">
          <ActionIcon color="blue" size="lg" variant="default" onClick={pollToggle} type="button">
            <FaPoll size="1.2rem" />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Embed">
          <ActionIcon color="blue" size="lg" variant="default" onClick={embedToggle} type="button">
            <ImEmbed size="1.2rem" />
          </ActionIcon>
        </Tooltip>
      </Group>
    </>
  );
};
