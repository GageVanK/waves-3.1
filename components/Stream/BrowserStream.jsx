import { Player, useCreateStream, useUpdateStream, Broadcast } from '@livepeer/react';
import { useMemo, useState, useContext, useEffect, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  updateProfile,
  getIsFollowing,
  updateFollowingStatus,
  submitPost,
  getSingleProfile,
} from 'deso-protocol';
import {
  Title,
  Input,
  Paper,
  Textarea,
  Group,
  Button,
  Space,
  Center,
  useMantineTheme,
  rgba,
  Tooltip,
  Card,
  Badge,
  Loader,
  Text,
  Progress,
  Divider,
  Accordion,
  Container,
  rem,
  Collapse,
  UnstyledButton,
  ActionIcon,
  PasswordInput,
  Switch,
  HoverCard,
  Blockquote,
  Image,
} from '@mantine/core';
import { BsExclamationCircle } from 'react-icons/bs';
import { TwitchEmbed } from 'react-twitch-embed';
import {
  IconCopy,
  IconRocket,
  IconCheck,
  IconScreenShare,
  IconAt,
  IconBrandYoutube,
  IconBrandTwitch,
  IconKey,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { RiYoutubeLine } from 'react-icons/ri';
import { BsTwitch } from 'react-icons/bs';
import { useInterval } from '@mantine/hooks';
import { DeSoIdentityContext } from 'react-deso-protocol';
import { RiKickLine } from 'react-icons/ri';
import { AiOutlineLink } from 'react-icons/ai';
import { GrLaunch } from 'react-icons/gr';
import { VscKey } from 'react-icons/vsc';
import { BiUserCircle } from 'react-icons/bi';
import { TiInfoLargeOutline } from 'react-icons/ti';
import classes from './Stream.module.css';
import { HowTo } from '@/components/HowTo/HowTo';
import { extractTwitchUsername } from '@/helpers/linkHelper';

export function BrowserStream() {
  const { currentUser } = useContext(DeSoIdentityContext);
  const [streamName, setStreamName] = useState('');
  const [isFollowingWaves, setisFollowingWaves] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [disable, { toggle }] = useDisclosure(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('first');
  const [openedMulti, { toggle: toggleMulti }] = useDisclosure(true);
  const embed = useRef();
  const [didLaunch, setDidLaunch] = useState(false);
  const theme = useMantineTheme();

  const handleReady = (e) => {
    embed.current = e;
  };

  const interval = useInterval(
    () =>
      setProgress((current) => {
        if (current < 100) {
          return current + 1;
        }

        interval.stop();
        setLoaded(true);
        return 0;
      }),
    20
  );

  // Allowing user to create streams via livepeers useCreateStream hook
  const {
    mutate: createStream,
    data: stream,
    status,
  } = useCreateStream(streamName ? { name: streamName } : null);

  const isLoading = useMemo(() => status === 'loading', [status]);

  const streamId = stream?.id;

  const { mutate: recordStream } = useUpdateStream({
    streamId,
    record: true,
  });

  const handleEnableRecording = async () => {
    recordStream?.();
  };
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);

  const [twitchStreamKey, setTwitchStreamKey] = useState('');
  const [twitchUsername, setTwitchUsername] = useState('');
  const [twitchInput, setTwitchInput] = useState('');
  const {
    mutate: twitchMultistream,
    error,
    isSuccess,
    status: twitchStatus,
  } = useUpdateStream({
    streamId,
    multistream: {
      targets: [
        {
          profile: 'source',
          spec: {
            name: 'Twitch',
            url: `rtmp://live.twitch.tv/app/${twitchStreamKey}`, // Use the RTMP URL entered by the user
          },
        },
      ],
    },
  });

  const handleEnableTwitchMultistream = async () => {
    // If user multistreams to Twitch and hasnt added their Twitch URL we add it to their profile
    if (!currentUser.ProfileEntryResponse?.ExtraData?.TwitchURL) {
      const updateData = {
        UpdaterPublicKeyBase58Check: currentUser?.PublicKeyBase58Check,
        ProfilePublicKeyBase58Check: '',
        NewUsername: '',
        MinFeeRateNanosPerKB: 1000,
        NewCreatorBasisPoints: 100,
        NewDescription: '',
        NewStakeMultipleBasisPoints: 12500,
        ExtraData: {
          TwitchURL: `https://www.twitch.tv/${twitchInput}`,
        },
      };

      await updateProfile(updateData);
    }

    // cast stream to twitch
    twitchMultistream?.();
  };

  const [ytStreamKey, setYTStreamKey] = useState('');
  const [ytStreamURL, setYTStreamURL] = useState('');
  const { mutate: youtubeMultistream, status: ytmulti } = useUpdateStream({
    streamId,
    multistream: {
      targets: [
        {
          profile: 'source',
          spec: {
            name: 'Youtube',
            url: `${ytStreamURL}/${ytStreamKey}`, // Use the RTMP URL entered by the user
          },
        },
      ],
    },
  });

  const handleEnableYTMultistream = async () => {
    youtubeMultistream?.();
  };

  const [kickStreamKey, setKickStreamKey] = useState('');
  const [kickStreamURL, setKickStreamURL] = useState('');
  const { mutate: kickMultistream, error: kickmulti } = useUpdateStream({
    streamId,
    multistream: {
      targets: [
        {
          profile: 'source',
          spec: {
            name: 'Kick',
            url: `${kickStreamURL}/app/${kickStreamKey}`, // Use the RTMP URL entered by the user
          },
        },
      ],
    },
  });

  const handleEnableKickMultistream = async () => {
    kickMultistream?.();
  };

  // Checking to see if Waves_Streams Account Follows the Streamer
  useEffect(() => {
    const isFollowingPublicKey = async () => {
      try {
        const result = await getIsFollowing({
          PublicKeyBase58Check: currentUser?.PublicKeyBase58Check,
          IsFollowingPublicKeyBase58Check:
            'BC1YLfjx3jKZeoShqr2r3QttepoYmvJGEs7vbYx1WYoNmNW9FY5VUu6',
        });

        setisFollowingWaves(result.IsFollowing);
      } catch (error) {
        console.log('Something went wrong:', error);
      }
    };

    isFollowingPublicKey();
  }, [currentUser]);

  const postStreamToDeso = async () => {
    try {
      !interval.active && interval.start();
      // Streamer follows the Waves_Streams Account
      // Waves_Streams follows Streamers back
      // Will be using the Waves_Streams Following Feed to display the livestreams on the Waves Feed
      // Lazy way of moderating the Waves Feed
      if (isFollowingWaves === false) {
        await updateFollowingStatus({
          MinFeeRateNanosPerKB: 1000,
          IsUnfollow: false,
          FollowedPublicKeyBase58Check: 'BC1YLfjx3jKZeoShqr2r3QttepoYmvJGEs7vbYx1WYoNmNW9FY5VUu6',
          FollowerPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        });
      }

      // Posts stream onchain making it accessible across all deso apps
      await submitPost({
        UpdaterPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        BodyObj: {
          Body: `${stream?.name}\nTo Subscribe and ensure the best viewing experience, visit: \nhttps://desowaves.vercel.app/wave/${currentUser.ProfileEntryResponse.Username}`,
          VideoURLs: [`https://lvpr.tv/?v=${stream?.playbackId}`],
          ImageURLs: [],
        },
        PostExtraData: {
          WavesStreamTitle: stream?.name,
        },
      });

      notifications.show({
        title: 'Success',
        icon: <IconCheck size="1.1rem" />,
        color: 'green',
        message: 'Your Wave has Launched to DeSo',
      });

      setDidLaunch(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        icon: <IconX size="1.1rem" />,
        color: 'red',
        message: `Something Happened: ${error}`,
      });
      console.log('something happened: ' + error);
      setDidLaunch(false);
      setLoaded(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Center>
        <Text fz="lg" fw={777} c="dimmed" truncate>
          Start Streaming
        </Text>
      </Center>
      <Space h="md" />
      <Textarea
        placeholder="Enter Stream Title"
        variant="filled"
        radius="md"
        disabled={disable}
        onChange={(e) => setStreamName(e.target.value)}
      />
      <Space h="xl" />
      {status === 'success' && (
        <>
          {streamName ? (
            <>
              <Container>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Blockquote
                    color="blue"
                    radius="xl"
                    iconSize={30}
                    icon={<BsExclamationCircle size="1.2rem" />}
                    mt="xl"
                  >
                    <Text fw={400} fs="italic">
                      1. Allow Access to your Webcam & Microphone.
                    </Text>
                    <Space h="xs" />
                    <Text fw={400} fs="italic">
                      2. Once your stream is Active, Click 'Launch Wave' to bring your broadcast to
                      Waves & all DeSo Apps!
                    </Text>
                  </Blockquote>

                  <Space h="md" />
                  <Group justify="center">
                    <Title order={1}>
                      <Text radius="sm" fw={700} fz="lg">
                        {streamName}
                      </Text>
                    </Title>
                  </Group>

                  <Divider my="sm" />

                  <Group justify="center">
                    <Button
                      rightSection={<IconRocket size="1rem" />}
                      fullWidth
                      className={classes.button}
                      onClick={() => {
                        postStreamToDeso();
                      }}
                      color={loaded ? 'teal' : theme.primaryColor}
                      disabled={didLaunch}
                    >
                      <div className={classes.label}>
                        {progress !== 0
                          ? 'Launching Waves'
                          : loaded
                          ? 'Wave Launched'
                          : 'Launch Wave'}
                      </div>
                      {progress !== 0 && (
                        <Progress
                          value={progress}
                          className={classes.progress}
                          color={rgba(theme.colors.blue[0], 0.35)}
                          radius="sm"
                        />
                      )}
                    </Button>
                  </Group>

                  <Space h="md" />
                </Card>
              </Container>
              <Space h="md" />
              <Center>
                <Group style={{ width: '500px' }}>
                  <Tooltip label="Stream to Multiple Platforms">
                    <Button
                      fullWidth
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'cyan' }}
                      radius="lg"
                      size="md"
                      onClick={toggleMulti}
                    >
                      {' '}
                      <Text fw={700} fz="lg">
                        Multistream
                      </Text>
                    </Button>
                  </Tooltip>
                </Group>
              </Center>
              <Collapse in={openedMulti}>
                <Divider my="sm" />
                <Paper shadow="md" radius="md" p="lg" withBorder>
                  <HoverCard width={280} closeDelay={700} shadow="md">
                    <HoverCard.Target>
                      <ActionIcon radius="xl" size="sm" variant="outline">
                        <TiInfoLargeOutline />
                      </ActionIcon>
                    </HoverCard.Target>
                    <HoverCard.Dropdown>
                      <Text fw={500} size="xs">
                        Broadcast your Stream to multiple platforms with Multistreaming!
                      </Text>
                      <Space h="xs" />
                      <Text fw={500} size="xs">
                        Just paste in the necessary information and click the Launch button.
                      </Text>
                      <Space h="xs" />
                      <Text fw={500} size="xs">
                        It is recommended to have separate tabs open of your Multistreams to ensure
                        everything is working!
                      </Text>
                      <Space h="xs" />
                      <Text fw={500} size="xs">
                        Be sure to set the Stream Title, Category, etc in the apps you are
                        multistreaming to.
                      </Text>
                    </HoverCard.Dropdown>
                  </HoverCard>
                  <Space h="xs" />
                  <Accordion variant="separated" radius="md" defaultValue="Twitch">
                    <Accordion.Item value="Twitch">
                      <Accordion.Control
                        icon={<BsTwitch size={'1.5rem'} color={'rgba(145, 70, 255)'} />}
                      >
                        <Text c="dimmed" fw={500}>
                          Twitch
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        {!currentUser.ProfileEntryResponse?.ExtraData?.TwitchURL && (
                          <Input
                            icon={<BiUserCircle />}
                            placeholder="Enter Your Twitch Username"
                            radius="md"
                            value={twitchInput}
                            onChange={(e) => setTwitchInput(e.target.value)}
                          />
                        )}

                        <Space h="md" />
                        <PasswordInput
                          icon={<VscKey />}
                          placeholder="Enter Your Twitch Stream Key"
                          radius="md"
                          value={twitchStreamKey}
                          onChange={(e) => setTwitchStreamKey(e.target.value)}
                        />
                        <Space h="md" />
                        <Group justify="right">
                          <Button
                            rightSectioncon={<IconRocket size="1rem" />}
                            variant="light"
                            size="xs"
                            onClick={handleEnableTwitchMultistream}
                            disabled={
                              !twitchStreamKey ||
                              (!twitchInput &&
                                !currentUser.ProfileEntryResponse?.ExtraData?.TwitchURL)
                            }
                          >
                            Launch
                          </Button>
                          {error && <div>{error.message}</div>}
                        </Group>

                        {twitchInput && !currentUser.ProfileEntryResponse?.ExtraData?.TwitchURL && (
                          <>
                            <Space h="md" />
                            <Group grow>
                              <TwitchEmbed channel={twitchInput} muted onReady={handleReady} />
                            </Group>
                          </>
                        )}
                      </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="Youtube">
                      <Accordion.Control icon={<RiYoutubeLine size={'1.5rem'} color="red" />}>
                        <Text c="dimmed" fw={500}>
                          Youtube
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Input
                          icon={<BiUserCircle />}
                          placeholder="Enter Your Youtube Stream URL"
                          radius="md"
                          value={ytStreamURL}
                          onChange={(e) => setYTStreamURL(e.target.value)}
                        />
                        <Space h="md" />
                        <PasswordInput
                          icon={<AiOutlineLink />}
                          placeholder="Enter Your Youtube Stream Key"
                          radius="md"
                          value={ytStreamKey}
                          onChange={(e) => setYTStreamKey(e.target.value)}
                        />
                        <Space h="md" />
                        <Group justify="right">
                          <Button
                            rightSection={<IconRocket size="1rem" />}
                            variant="light"
                            size="xs"
                            onClick={handleEnableYTMultistream}
                          >
                            Launch
                          </Button>
                          {ytmulti && <div>{ytmulti.message}</div>}
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="Kick">
                      <Accordion.Control icon={<RiKickLine size={'1.5rem'} color="green" />}>
                        {' '}
                        <Text c="dimmed" fw={500}>
                          Kick
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Input
                          icon={<AiOutlineLink />}
                          placeholder="Enter Kick Stream URL"
                          radius="md"
                          value={kickStreamURL}
                          onChange={(e) => setKickStreamURL(e.target.value)}
                        />
                        <Space h="md" />
                        <PasswordInput
                          icon={<VscKey />}
                          placeholder="Enter Kick Stream Key"
                          radius="md"
                          value={kickStreamKey}
                          onChange={(e) => setKickStreamKey(e.target.value)}
                        />{' '}
                        <Space h="md" />
                        <Group justify="right">
                          <Button
                            onClick={handleEnableKickMultistream}
                            rightSectioncon={<IconRocket size="1rem" />}
                            variant="light"
                            size="xs"
                          >
                            Launch
                          </Button>
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Paper>
              </Collapse>

              <Space h="md" />
              {!didLaunch ? (
                <>
                  <Blockquote
                    color="red"
                    radius="xl"
                    iconSize={30}
                    icon={<BsExclamationCircle size="1.2rem" />}
                    mt="xl"
                  >
                    <Text fw={400} fs="italic">
                      This stream playback is not public. Please click Launch Wave to make it
                      accessible across all DeSo Apps.
                    </Text>
                  </Blockquote>
                  <Space h="md" />
                </>
              ) : (
                <>
                  <Blockquote
                    color="blue"
                    radius="xl"
                    iconSize={30}
                    icon={<BsExclamationCircle size="1.2rem" />}
                    mt="xl"
                  >
                    <Text fw={400} fs="italic">
                      Yay! Your wave is available on Waves and all DeSo Apps!
                    </Text>
                  </Blockquote>
                  <Space h="md" />
                </>
              )}
              <Group justify="center">
                <Broadcast title={stream?.name} streamKey={stream.streamKey} muted />
              </Group>

              <Space h="md" />
            </>
          ) : (
            <Group justify="center">
              <p>Wave suspended. Refresh to create a new Wave.</p>
            </Group>
          )}
        </>
      )}
      {status === 'loading' && (
        <Group justify="center">
          <Loader size="sm" />
        </Group>
      )}
      {status === 'error' && (
        <Group justify="center">
          <p>Error occurred while creating your wave.</p>
        </Group>
      )}
      <Space h="md" />
      {!stream && (
        <Group justify="center">
          <Button
            radius="xl"
            onClick={() => {
              toggle();

              createStream?.(); // Create the stream and store the result
            }}
            disabled={isLoading || !createStream}
          >
            Create Wave
          </Button>
        </Group>
      )}
      <Space h="md" />
    </>
  );
}
